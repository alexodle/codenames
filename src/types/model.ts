import { InvalidRequestError } from "../util/errors"

export type Team = '1' | '2'
export const TEAMS: Team[] = ['1', '2']
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

// Just for 2-player mode
export type CoveredCitizenTeam = Team | 'full'

export type SpecCardSide = 'front' | 'back'

export type CellType = 'citizen' | 'agent' | 'assassin'

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

export interface GameBoardCell {
  game_id: number
  row: number
  col: number
  word: string
  covered?: CoverType
  covered_citizen_team?: CoveredCitizenTeam
}

export interface GameTurn {
  game_id: number
  turn_num: number
  team: Team
  hint_word?: string
  hint_num?: number
  guesses: Guess[]
}

export interface Guess {
  game_id: number
  turn_num: number
  guess_num: number
  row: number
  col: number
}

export interface GameInfo {
  id: number
  is_started: boolean
  created_by_player_id: number
  current_turn_num?: number
  game_type?: GameType
  winning_team?: Team
  players: GamePlayer[]
}

export interface Game extends GameInfo {
  currentTurn?: GameTurn
  board: GameBoardCell[]
}

export interface SpecCardCell {
  spec_card_id: number
  side: SpecCardSide
  row: number
  col: number
  cell_type: CellType
}

export interface TeamBoardSpec {
  team: Team
  spec_card_id: number
  spec_card_side: SpecCardSide
  specCardCells: SpecCardCell[]
}

export type GameEvent = GuessEvent | CellCoverEvent | PassEvent | NextTurnEvent | GameOverEvent;

export type GuessEvent = {
  type: 'guess'
  turnNum: number
  guessNum: number
  row: number
  col: number
}

export type CitizenCoverEvent = {
  type: 'cover'
  newCover: 'citizen'
  turnNum: number
  row: number
  col: number
  newCoverCitizenTeam: CoveredCitizenTeam
}

export type CellCoverEvent = CitizenCoverEvent | {
  type: 'cover'
  newCover: Exclude<CoverType, 'citizen'>
  turnNum: number
  row: number
  col: number
}

export type PassEvent = {
  type: 'pass'
  turnNum: number
}

export type NextTurnEvent = {
  type: 'nextturn'
  nextTeam: Team
  nextTurnNum: number
}

export type GameOverEvent = {
  type: 'gameover'
  turnNum: number
  winner?: Team
}
