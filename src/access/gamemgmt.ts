import { random, sample, sampleSize, shuffle } from "lodash"
import { isNullOrUndefined } from "util"
import { query, withTransaction } from "../db"
import { Game, GameBoardCell, GameInfo, GamePlayer, GameTurn, GameType, Guess, Player, PlayerType, SpecCardSide, Team, TEAMS } from "../types/model"
import { COLS, ROWS } from "../util/constants"
import { InvalidRequestError, NotFoundError } from "../util/errors"
import { playersByPosition } from "../util/util"
import { ensureUpdated } from "./util"

export const createGame = async (player: Player): Promise<number> => {
  const result = await query('INSERT INTO game(created_by_player_id) VALUES($1) RETURNING id;', [player.id,])
  return (result.rows[0] as any).id as number
}

export const getGameInfo = async (gameID: number): Promise<GameInfo> => {
  const result = await query(`
    SELECT id, created_by_player_id, current_turn_num, game_type, winning_team
    FROM game
    WHERE id = $1
    LIMIT 1;`, [gameID])
  if (!result.rows.length) {
    throw new NotFoundError(`game not found: ${gameID}`)
  }
  const game = result.rows[0] as GameInfo
  game.is_started = !!game.game_type

  const players = await getGamePlayers(gameID)
  game.players = players

  return game
}

export const getGame = async (gameID: number): Promise<Game> => {
  const result = await query(`
    SELECT id, created_by_player_id, current_turn_num, game_type, winning_team
    FROM game
    WHERE id = $1
    LIMIT 1;`, [gameID])
  if (!result.rows.length) {
    throw new NotFoundError(`game not found: ${gameID}`)
  }
  const game = result.rows[0] as Game
  game.is_started = !!game.game_type

  const [players, board, currentTurn] = await Promise.all([
    getGamePlayers(gameID),
    getGameBoard(gameID),
    !isNullOrUndefined(game.current_turn_num) ? getTurn(gameID, game.current_turn_num) : undefined])

  game.players = players
  game.board = board
  game.currentTurn = currentTurn

  return game
}

export const getInProgressGameInfosByPlayer = async (playerID: number): Promise<GameInfo[]> => {
  const result = await query<GameInfo>(`
    SELECT id, created_by_player_id, game_type, winning_team
    FROM game
    WHERE
      created_by_player_id = $1 AND
      winning_team IS NULL;
    `, [playerID])
  result.rows.forEach(r => { r.is_started = !!r.game_type })
  return result.rows
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

export const addPlayerToGame = async (gameID: number, playerID: number, team: Team, playerType: PlayerType) => {
  // TODO: ensure game hasn't started yet
  await withTransaction(async client => {
    client.query(`DELETE FROM game_player WHERE game_id = $1 AND player_id = $2;`, [gameID, playerID])
    if (playerType === 'codemaster') {
      client.query(`DELETE FROM game_player WHERE game_id = $1 AND team = $2 AND player_type = 'codemaster';`, [gameID, team])
    }
    client.query(`INSERT INTO game_player(game_id, player_id, team, player_type) VALUES($1, $2, $3, $4);`, [gameID, playerID, team, playerType])
  })
  // TODO: rely on postgres triggers
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

const selectRandomSpecCardID = async (): Promise<number> => {
  const allCardsResult = await query<{ id: number }>(`SELECT id FROM spec_card;`, [])
  const i = random(allCardsResult.rows.length - 1)
  return allCardsResult.rows[i].id
}

const selectRandomCards = async (): Promise<string[]> => {
  const result = await query<{ word: string }>(`SELECT word FROM word_card;`, [])
  return shuffle(sampleSize(result.rows, ROWS * COLS).map(r => r.word))
}