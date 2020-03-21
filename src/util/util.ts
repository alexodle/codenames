import { GamePlayer, Game, Team } from "../types/model"
import { ROWS, COLS } from "./constants"

export const keyBy = <T>(a: T[], cb: (v: T) => string): { [key: string]: T } => {
  const d: { [key: string]: T } = {}
  for (const v of a) {
    const k = cb(v)
    d[k] = v
  }
  return d
}

export const groupBy = <T>(a: T[], cb: (v: T) => string): { [key: string]: T[] } => {
  const d: { [key: string]: T[] } = {}
  for (const v of a) {
    const k = cb(v)
    const g = d[k] = d[k] || []
    g.push(v)
  }
  return d
}

// Returns [codemaster1, codemaster2, guessers1, guessers2]
export const playersByPosition = (players: GamePlayer[]): [GamePlayer | undefined, GamePlayer | undefined, GamePlayer[], GamePlayer[]] => {
  const groups = groupBy(players, p => `${p.team}:${p.player_type}`)
  const codemaster1 = (groups['1:codemaster'] || [])[0]
  const codemaster2 = (groups['2:codemaster'] || [])[0]
  const guessers1 = groups['1:guesser'] || []
  const guessers2 = groups['2:guesser'] || []
  return [codemaster1, codemaster2, guessers1, guessers2]
}

export const getOtherTeam = (team: Team): Team => team === '1' ? '2' : '1'

export const getCellKey = (cell: { row: number, col: number }): string => `${cell.row}:${cell.col}`

export const getCellIdx = (cell: { row: number, col: number }): number => cell.row * ROWS + cell.col % COLS
