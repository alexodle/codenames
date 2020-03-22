import { CellCoverEvent, Game, GameEvent, GamePlayer, Guess, Team, TeamBoardSpec, TEAMS } from "../types/model";
import { InvalidRequestError } from "../util/errors";
import { getCellIdx, getCellKey, getOtherTeam, keyBy } from "../util/util";
import { TWO_PLAYER_TURNS } from "../util/constants";
import next from "next";

export const processGuess2Player = (game: Game, boardSpecs: TeamBoardSpec[], player: GamePlayer, guess: Guess): GameEvent[] => {
  const results: GameEvent[] = []

  ensureCorrectTurn(game, player, guess.turn_num)!

  const otherTeam = getOtherTeam(player.team)
  const boardSpec = boardSpecs.find(s => s.team === otherTeam)!

  const cellIdx = getCellIdx(guess)
  const cell = game.board[cellIdx]
  const cellSpec = boardSpec.specCardCells[cellIdx]
  if (cell.row !== guess.row || cell.col !== guess.col || cellSpec.row !== guess.row || cellSpec.col !== guess.col) {
    throw new Error('Cells out of order')
  }

  const citizenOccupied = cell.covered === 'citizen' && (cell.covered_citizen_team === 'full' || cell.covered_citizen_team === player.team)
  if (cell.covered && (cell.covered !== 'citizen' || citizenOccupied)) {
    throw new InvalidRequestError('Cell already covered')
  }

  results.push({ type: 'guess', turnNum: guess.turn_num, guessNum: guess.guess_num, row: guess.row, col: guess.col })

  if (cellSpec.cell_type === 'assassin') {
    results.push(
      { type: 'cover', newCover: 'assassin', turnNum: guess.turn_num, row: guess.row, col: guess.col },
      { type: 'gameover', turnNum: guess.turn_num })

  } else if (cellSpec.cell_type === 'citizen') {
    const citizenTeam = cell.covered_citizen_team ? 'full' : player.team
    const coverEvent: GameEvent = { type: 'cover', newCover: 'citizen', turnNum: guess.turn_num, row: guess.row, col: guess.col, newCoverCitizenTeam: citizenTeam }
    const nextEvent: GameEvent = guess.turn_num < TWO_PLAYER_TURNS ?
      { type: 'nextturn', nextTeam: player.team, nextTurnNum: guess.turn_num + 1 } :
      { type: 'gameover', turnNum: guess.turn_num }
    results.push(coverEvent, nextEvent)

  } else {
    results.push({ type: 'cover', newCover: otherTeam, turnNum: guess.turn_num, row: guess.row, col: guess.col })
    if (isGameOver2Player(game, boardSpecs, results)) {
      results.push({ type: 'gameover', turnNum: guess.turn_num, winner: '1' })
    }

  }
  return results
}

export const processPass = (game: Game, player: GamePlayer, turnNum: number): GameEvent[] => {
  ensureCorrectTurn(game, player, turnNum)
  if (turnNum === TWO_PLAYER_TURNS) {
    throw new InvalidRequestError('Cannot pass on last turn')
  }
  return [
    { type: 'pass', turnNum },
    { type: 'nextturn', nextTeam: player.team, nextTurnNum: turnNum + 1 },
  ]
}

const isGameOver2Player = (game: Game, boardSpecs: TeamBoardSpec[], events: GameEvent[]): boolean => {
  const newlyCovered = keyBy(events.filter(e => e.type === 'cover') as CellCoverEvent[], getCellKey)
  for (const spec of boardSpecs) {
    const uncoveredCell = spec.specCardCells
      .filter(c => c.cell_type === 'agent')
      .find(c => {
        const cover = game.board[getCellIdx(c)].covered
        const newCover = newlyCovered[getCellKey(c)]?.newCover
        const covered = (cover && TEAMS.includes(cover as Team)) || (newCover && TEAMS.includes(newCover as Team))
        return !covered
      })
    if (uncoveredCell) {
      return false
    }
  }
  return true
}

const ensureCorrectTurn = (game: Game, player: GamePlayer, turnNum: number) => {
  const currentTurn = game.currentTurn
  if (!currentTurn) {
    throw new InvalidRequestError('Game not started')
  }
  if (currentTurn.turn_num !== turnNum) {
    throw new InvalidRequestError(`Unexpected turn_num:${turnNum}, expected:${currentTurn.turn_num}`)
  }
  if (player.team === currentTurn.team) {
    throw new InvalidRequestError(`Guess out of turn`)
  }
}
