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

export interface GameInfo {
  id: number
  created_on: Date
  created_by_player_id: number
  is_started: boolean
  current_turn_num?: number
  game_type?: GameType
  winning_team?: Team
  game_over: boolean
  players: GamePlayer[]
}

export interface Game extends GameInfo {
  currentTurn?: GameTurn
  board: GameBoardCell[]
}

export interface Player {
  id: number
  name: string
  sub: string
}

export interface GamePlayer {
  game_id: number
  player_id: number
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
  allow_pass: boolean // in 2-player, this will be false on last turn OR if the other team is done
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

export type GameEvent = HintEvent | GuessEvent | CellCoverEvent | PassEvent | NextTurnEvent | GameOverEvent;

export type HintEvent = {
  type: 'hint'
  turnNum: number
  hint: string
  hintNum: number
}

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
  nextTurnAllowPass: boolean
}

export type GameOverEvent = {
  type: 'gameover'
  turnNum: number
  winner?: Team
}

export interface GameChangeV2Notification {
  gameID: number
  events: GameEvent[]
}

export interface Auth0User {
  sub: string
  name: string
}

export interface LoginState {
  nonce: string
  date_created: Date
  redirect_url: string
}
