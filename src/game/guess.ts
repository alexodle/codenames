import { CellCoverEvent, Game, GameEvent, GamePlayer, Guess, Team, TeamBoardSpec, TEAMS } from "../types/model";
import { InvalidRequestError } from "../util/errors";
import { getCellIdx, getCellKey, getOtherTeam, keyBy } from "../util/util";

export const processGuess2Player = (game: Game, boardSpecs: TeamBoardSpec[], player: GamePlayer, guess: Guess): GameEvent[] => {
  const results: GameEvent[] = []

  ensureCorrectTurn(game, player, guess.turn_num)!

  const currentTurn = game.currentTurn!
  const otherTeam = getOtherTeam(player.team)
  const boardSpec = boardSpecs.find(s => s.team === player.team)!

  const cellIdx = getCellIdx(guess)
  const cell = game.board[cellIdx]
  const cellSpec = boardSpec.specCardCells[cellIdx]
  if (cell.row !== guess.row || cell.col !== guess.col || cellSpec.row !== guess.row || cellSpec.col !== guess.col) {
    throw new Error('Cells out of order')
  }
  if (cell.covered && cell.covered !== 'citizen') {
    throw new InvalidRequestError('Cell already covered')
  }

  results.push({ type: 'guess', turnNum: guess.turn_num, guessNum: guess.guess_num, row: guess.row, col: guess.col })

  if (cellSpec.cell_type === 'assassin') {
    results.push(
      { type: 'cover', turnNum: guess.turn_num, row: guess.row, col: guess.col, newCover: 'assassin' },
      { type: 'gameover', turnNum: guess.turn_num })
  } else if (cellSpec.cell_type === 'citizen') {
    results.push(
      { type: 'cover', turnNum: guess.turn_num, row: guess.row, col: guess.col, newCover: 'citizen' },
      { type: 'nextturn', nextTeam: player.team, nextTurnNum: guess.turn_num + 1 })
  } else {
    results.push({ type: 'cover', turnNum: guess.turn_num, row: guess.row, col: guess.col, newCover: otherTeam })

    const gameOver = isGameOver2Player(game, boardSpecs, results)
    if (gameOver) {
      results.push({ type: 'gameover', turnNum: guess.turn_num, winner: '1' })
    }
  }

  return results
}

export const processPass = (game: Game, player: GamePlayer, turnNum: number): GameEvent[] => {
  ensureCorrectTurn(game, player, turnNum)
  return [
    { type: 'pass', turnNum },
    { type: 'nextturn', nextTeam: getOtherTeam(player.team), nextTurnNum: turnNum + 1 },
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
