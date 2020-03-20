import { query, withTransaction } from "../db"
import { Game, GameBoardCell, GameInfo, GamePlayer, GameScore, GameTurn, Player, PlayerType, Team } from "../types/model"
import { NotFoundError } from "../util/errors"
import { isNullOrUndefined } from "util"

export const createGame = async (player: Player): Promise<number> => {
  const result = await query('INSERT INTO game(created_by_player_id) VALUES($1) RETURNING id;', [player.id,])
  return (result.rows[0] as any).id as number
}

export const getGameInfo = async (gameID: number): Promise<GameInfo> => {
  const result = await query(`
    SELECT id, created_by_player_id, game_type, winning_team
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

  const [players, scores, board, currentTurn] = await Promise.all([
    getGamePlayers(gameID),
    getGameScores(gameID),
    getGameBoard(gameID),
    !isNullOrUndefined(game.current_turn_num) ? getCurrentTurn(gameID, game.current_turn_num) : undefined])

  game.players = players
  game.scores = scores
  game.board = board
  game.currentTurn = currentTurn

  return game
}

export const getInProgressGameInfosByPlayer = async (playerID: number): Promise<GameInfo[]> => {
  const result = await query(`
    SELECT id, created_by_player_id, game_type, winning_team
    FROM game
    WHERE
      created_by_player_id = $1 AND
      winning_team IS NULL;
    `, [playerID])
  result.rows.forEach((r: any) => { r.is_started = !!r.game_type })
  return result.rows as GameInfo[]
}

export const addPlayerToGame = async (gameID: number, playerID: number, team: Team, playerType: PlayerType) => {
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

const getCurrentTurn = async (gameID: number, turnNum: number): Promise<GameTurn> => {
  const result = await query(`
    SELECT game_id, turn_num, team, hint_word, hint_num
    FROM game_turn
    WHERE game_id = $1 AND turn_num = $2
    LIMIT 1;`, [gameID, turnNum])
  if (!result.rows.length) {
    throw new NotFoundError(`Current turn not found for gameID:${gameID}, turnNum:${turnNum}`)
  }
  return result.rows[0] as GameTurn
}

const getGameBoard = async (gameID: number): Promise<GameBoardCell[]> => {
  const result = await query(`SELECT game_id, row, col, word, covered FROM game_board_cell WHERE game_id = $1;`, [gameID])
  return result.rows as GameBoardCell[]
}

const getGameScores = async (gameID: number): Promise<GameScore[]> => {
  const result = await query(`SELECT game_id, team, score FROM game_score WHERE game_id = $1;`, [gameID])
  return result.rows as GameScore[]
}

const getGamePlayers = async (gameID: number): Promise<GamePlayer[]> => {
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
