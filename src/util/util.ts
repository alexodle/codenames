import { GamePlayer, Game, Team } from "../types/model"
import { ROWS, COLS } from "./constants"
import { InvalidSessionError } from "./errors"


export const sort = <T>(a: T[]): T[] => {
  const b = [...a]
  b.sort()
  return b
}

export const range = (size: number, startAt: number = 0): number[] => {
  const a = []
  const max = startAt + size
  for (let i = startAt; i < max; i++) {
    a.push(i)
  }
  return a
}

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

export const any = <T>(a: T[], cb: (v: T) => boolean): boolean => {
  for (const v of a) {
    if (cb(v)) return true
  }
  return false
}

export const capitalize = (s: string): string => s[0].toUpperCase() + s.substr(1)

export const getErrorMessage = async (res: Response): Promise<string> => {
  try {
    return await res.text()
  } catch {
    return `${res.statusText} (${res.status})`
  }
}

const AUTH_ERRORS = [401, 402, 403]
export const ensureResponseOk = async (res: Response): Promise<Response> => {
  if (!res.ok) {
    if (AUTH_ERRORS.includes(res.status)) {
      throw new InvalidSessionError()
    } else {
      throw new Error(await getErrorMessage(res))
    }
  }
  return res
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


const HINT_RE = /^[a-zA-Z]+( *[a-zA-Z]+)?$/
export const isValidHintQuick = (hint: string) => hint && HINT_RE.test(hint.trim())

export const isValidHint = (hint: string, words: string[]) => {
  hint = hint.trim().toLowerCase()
  return isValidHintQuick(hint) && !any(words.map(w => w.toLowerCase()), w => (
    hint.length > w.length ? hint.includes(w) : w.includes(hint)
  ))
}
