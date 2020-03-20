import { InvalidRequestError } from "../util/errors"

export type Team = '1' | '2'
export const asTeam = (team: string | string[]): Team => {
  if (team !== '1' && team !== '2') throw new InvalidRequestError(`invalid team: ${team}`)
  return team as Team
}

export type GameType = '2player' | '4player'

export type PlayerType = 'codemaster' | 'guesser'
export const asPlayerType = (playerType: string | string[]): PlayerType => {
  if (playerType !== 'codemaster' && playerType !== 'guesser') throw new InvalidRequestError(`invalid playerType: ${playerType}`)
  return playerType as PlayerType
}

export type CoverType = Team | 'assassin' | 'citizen'

export interface Auth0User {
  sub: string
  name: string
}

export interface Player {
  id: number
  name: string
  sub: string
}

export interface GamePlayer {
  game_id: number
  player_id: Number
  team: Team
  player_type: PlayerType

  player?: Player
}

export interface GameScore {
  game_id: number
  team: Team
  score: number
}

export interface GameBoardCell {
  game_id: number
  row: number
  col: number
  word: string
  covered?: CoverType
}

export interface GameTurn {
  game_id: number
  turn_num: number
  team: Team
  hint_word?: string
  hint_num?: number
}

export interface GameInfo {
  id: number
  is_started: boolean
  created_by_player_id: number
  game_type?: GameType
  winning_team?: Team
  players: GamePlayer[]
}

export interface Game extends GameInfo {
  current_turn_num?: number
  currentTurn?: GameTurn
  scores: GameScore[]
  board: GameBoardCell[]
}
