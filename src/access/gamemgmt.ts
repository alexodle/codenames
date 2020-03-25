import { random, sample, sampleSize, shuffle } from "lodash"
import { Client, query, withTransaction } from "../db"
import { Game, GameBoardCell, GameInfo, GamePlayer, GameTurn, GameType, Guess, Player, PlayerType, SpecCardSide, Team, TEAMS } from "../types/model"
import { COLS, ROWS } from "../util/constants"
import { InvalidRequestError, NotFoundError } from "../util/errors"
import { playersByPosition, keyBy, groupBy } from "../util/util"
import { ensureUpdated } from "./util"

export const createGame = async (player: Player): Promise<number> => {
  let gameID: number | undefined = undefined
  await withTransaction(async client => {
    const gameResult = await client.query<{ id: number }>('INSERT INTO game(created_by_player_id) VALUES($1) RETURNING id;', [player.id,])
    gameID = gameResult.rows[0].id

    await addPlayerToGameImpl(gameID, player.id, '1', 'codemaster', client)
  })
  return gameID!
}

export const getGameInfosByPlayer = async (playerID: number, gameState: 'unstarted' | 'active' | 'completed', limit: number) => {
  const result = await query<GameInfo>(`
    SELECT id, created_on, created_by_player_id, current_turn_num, game_type, winning_team, game_over
    FROM game
    WHERE
      created_by_player_id = $1 AND
      ${gameState === 'unstarted' ? 'game_over = false AND game_type IS NULL' : ''}
      ${gameState === 'active' ? 'game_over = false AND game_type IS NOT NULL' : ''}
      ${gameState === 'completed' ? 'game_over = true' : ''}
    ORDER BY created_on DESC
    LIMIT $2;
    `, [playerID, limit])
  result.rows.forEach(r => { r.is_started = !!r.game_type })

  return await attachGamePlayersToGames(result.rows)
}

export const getGameInfo = async (gameID: number): Promise<GameInfo> => {
  const result = await query<GameInfo>(`
    SELECT id, created_on, created_by_player_id, current_turn_num, game_type, winning_team, game_over
    FROM game
    WHERE id = $1
    LIMIT 1;`, [gameID])
  if (!result.rows.length) {
    throw new NotFoundError(`game not found: ${gameID}`)
  }

  const game = result.rows[0]
  game.is_started = !!game.game_type

  await attachGamePlayersToGames([game])
  return game
}

export const getGame = async (gameID: number): Promise<Game> => {
  const game = await getGameInfo(gameID) as Game

  const [board, currentTurn] = await Promise.all([
    getGameBoard(gameID),
    game.is_started ? getTurn(gameID, game.current_turn_num!) : undefined])

  game.board = board
  game.currentTurn = currentTurn

  return game
}

export const getGamePlayers = async (gameID: number): Promise<GamePlayer[]> => {
  const result = await query(`
    SELECT game_id, team, player_type, player_id, p.name player_name, p.sub player_sub
    FROM game_player
    JOIN player p ON p.id = player_id
    WHERE game_id = $1;`, [gameID])
  const players: GamePlayer[] = result.rows.map((r: any) => ({
    game_id: r.game_id,
    player_id: r.player_id,
    team: r.team,
    player_type: r.player_type,
    player: {
      id: r.player_id,
      name: r.player_name,
      sub: r.player_sub,
    }
  }))
  return players
}

export const startGame = async (gameID: number) => {
  const players = await getGamePlayers(gameID)
  const [codemaster1, codemaster2, guessers1, guessers2] = playersByPosition(players)
  if (!codemaster1 || !codemaster2) {
    throw new InvalidRequestError('Missing codemasters')
  }
  if (guessers1.length > 0 !== guessers2.length > 0) {
    throw new InvalidRequestError('Missing guessers on one side')
  }
  const gameType: GameType = !guessers1.length ? '2player' : '4player'

  const [cards, specCardID] = await Promise.all([selectRandomCards(), selectRandomSpecCardID()])
  const firstTeam: Team = sample(TEAMS)!

  const sides: SpecCardSide[] = shuffle(['front', 'back'])
  const teamSides = { '1': sides[0], '2': sides[1] }

  await withTransaction(async client => {
    ensureUpdated('Game already started', await client.query(`
      UPDATE game
      SET current_turn_num = 1, game_type = $2
      WHERE id = $1 AND game_type IS NULL;
      `, [gameID, gameType]))

    for (let i = 0; i < cards.length; i++) {
      const row = Math.floor(i / ROWS)
      const col = i % COLS
      ensureUpdated('Failed to create board', await client.query(`
        INSERT INTO game_board_cell(game_id, row, col, word)
        VALUES($1, $2, $3, $4)
        `, [gameID, row, col, cards[i]]))
    }

    ensureUpdated('Failed to create turn', await client.query(`
      INSERT INTO game_turn(game_id, turn_num, team)
      VALUES($1, $2, $3);
      `, [gameID, 1, firstTeam]))

    for (const team of TEAMS) {
      ensureUpdated('Failed to create team board', await client.query(`
        INSERT INTO team_board_spec(game_id, team, spec_card_id, spec_card_side)
        VALUES($1, $2, $3, $4);
        `, [gameID, team, specCardID, teamSides[team]]))
    }
  })
  // TODO: rely on postgres triggers
  query(`NOTIFY gameChange, '${gameID}';`, [])
}

const addPlayerToGameImpl = async (gameID: number, playerID: number, team: Team, playerType: PlayerType, client: Client) => {
  // TODO: ensure game hasn't started yet
  client.query(`DELETE FROM game_player WHERE game_id = $1 AND player_id = $2;`, [gameID, playerID])
  if (playerType === 'codemaster') {
    client.query(`DELETE FROM game_player WHERE game_id = $1 AND team = $2 AND player_type = 'codemaster';`, [gameID, team])
  }
  client.query(`INSERT INTO game_player(game_id, player_id, team, player_type) VALUES($1, $2, $3, $4);`, [gameID, playerID, team, playerType])
}

export const addPlayerToGame = async (gameID: number, playerID: number, team: Team, playerType: PlayerType) => {
  await withTransaction(async client => {
    await addPlayerToGameImpl(gameID, playerID, team, playerType, client)
  })
  query(`NOTIFY gameChange, '${gameID}';`, [])
}

export const getTurn = async (gameID: number, turnNum: number): Promise<GameTurn> => {
  const result = await query<GameTurn>(`
    SELECT game_id, turn_num, team, hint_word, hint_num
    FROM game_turn
    WHERE game_id = $1 AND turn_num = $2
    LIMIT 1;`, [gameID, turnNum])
  if (!result.rows.length) {
    throw new NotFoundError(`Current turn not found for gameID:${gameID}, turnNum:${turnNum}`)
  }
  const turn = result.rows[0]

  const guessesResult = await query<Guess>(`
    SELECT game_id, turn_num, guess_num, row, col
    FROM game_turn_guesses
    WHERE game_id = $1 AND turn_num = $2
    ORDER BY guess_num ASC;
    `, [gameID, turnNum])
  turn.guesses = guessesResult.rows

  return result.rows[0]
}

export const getGameBoard = async (gameID: number): Promise<GameBoardCell[]> => {
  const result = await query<GameBoardCell>(`
    SELECT game_id, row, col, word, covered, covered_citizen_team
    FROM game_board_cell
    WHERE game_id = $1
    ORDER BY row ASC, col ASC;
    `, [gameID])
  return result.rows
}

const attachGamePlayersToGames = async (games: GameInfo[]): Promise<GameInfo[]> => {
  const gameIDs = games.map(g => g.id)
  const gamePlayerResult = await query<GamePlayer & { player_name: string, player_sub: string }>(`
    SELECT game_id, team, player_type, player_id, p.name player_name, p.sub player_sub
    FROM game_player
    JOIN player p ON player_id = p.id
    WHERE game_id = ANY($1::int[]);
    `, [gameIDs])
  gamePlayerResult.rows.forEach(gp => {
    gp.player = { id: gp.player_id, name: gp.player_name, sub: gp.player_sub }
  })

  const gamePlayersByGameID = groupBy(gamePlayerResult.rows, gp => gp.game_id.toString())
  games.forEach(g => {
    g.players = gamePlayersByGameID[g.id.toString()] || []
  })

  return games
}

const selectRandomSpecCardID = async (): Promise<number> => {
  const allCardsResult = await query<{ id: number }>(`SELECT id FROM spec_card;`, [])
  const i = random(allCardsResult.rows.length - 1)
  return allCardsResult.rows[i].id
}

const selectRandomCards = async (): Promise<string[]> => {
  const result = await query<{ word: string }>(`SELECT word FROM word_card;`, [])
  return shuffle(sampleSize(result.rows, ROWS * COLS).map(r => r.word))
}
