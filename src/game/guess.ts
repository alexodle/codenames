import { CellCoverEvent, Game, GameEvent, GamePlayer, Guess, Team, TeamBoardSpec, TEAMS, NextTurnEvent } from "../types/model";
import { TWO_PLAYER_TURNS } from "../util/constants";
import { InvalidRequestError } from "../util/errors";
import { getCellIdx, getCellKey, getOtherTeam, keyBy } from "../util/util";

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
    results.push(coverEvent)

    if (guess.turn_num === TWO_PLAYER_TURNS) {
      results.push({ type: 'gameover', turnNum: guess.turn_num })
    } else {
      const teamsDone = calcTeamsDone(game, boardSpecs, results)
      const nextTeam = !teamsDone.includes(otherTeam) ? getOtherTeam(game.currentTurn!.team) : game.currentTurn!.team
      results.push(withNextTurnAllowPass(game, teamsDone, {
        type: 'nextturn',
        nextTeam,
        nextTurnNum: guess.turn_num + 1,
      }))
    }

  } else {
    results.push({ type: 'cover', newCover: otherTeam, turnNum: guess.turn_num, row: guess.row, col: guess.col })

    const teamsDone = calcTeamsDone(game, boardSpecs, results)
    if (teamsDone.length === 2) {
      results.push({ type: 'gameover', turnNum: guess.turn_num, winner: '1' })
    } else if (teamsDone.includes(player.team)) {
      results.push(withNextTurnAllowPass(game, teamsDone, {
        type: 'nextturn',
        nextTeam: getOtherTeam(game.currentTurn!.team),
        nextTurnNum: guess.turn_num + 1,
      }))
    }
  }

  return results
}

export const processPass = (game: Game, boardSpecs: TeamBoardSpec[], player: GamePlayer, turnNum: number): GameEvent[] => {
  ensureCorrectTurn(game, player, turnNum)
  if (game.game_type !== '2player') {
    return [{ type: 'pass', turnNum }]
  }

  if (turnNum === TWO_PLAYER_TURNS) {
    throw new InvalidRequestError('Cannot pass on last turn')
  }

  if (!game.currentTurn!.allow_pass) {
    throw new InvalidRequestError('Not allowing pass on this turn')
  }

  const teamsDone = calcTeamsDone(game, boardSpecs, [])
  if (teamsDone.includes(getOtherTeam(player.team))) {
    throw new InvalidRequestError('Cannot pass when other team is done')
  }

  return [
    { type: 'pass', turnNum },
    withNextTurnAllowPass(game, teamsDone, { type: 'nextturn', nextTeam: player.team, nextTurnNum: turnNum + 1 }),
  ]
}

const withNextTurnAllowPass = (game: Game, teamsDone: Team[], ev: Omit<NextTurnEvent, 'nextTurnAllowPass'>): NextTurnEvent => {
  const fullEv = ev as NextTurnEvent
  fullEv.nextTurnAllowPass = game.game_type !== '2player' || (
    ev.nextTurnNum !== TWO_PLAYER_TURNS &&
    !teamsDone.includes(ev.nextTeam))
  return fullEv
}

const calcTeamsDone = (game: Game, boardSpecs: TeamBoardSpec[], events: GameEvent[]): Team[] => {
  const newlyCovered = keyBy(events.filter(e => e.type === 'cover') as CellCoverEvent[], getCellKey)

  // Use the opposite team's spec to determine if the team is done or not
  const team1Spec = boardSpecs.find(s => s.team === '2')!
  const team2Spec = boardSpecs.find(s => s.team === '1')!

  const teamsDone: Team[] = []
  if (specAgentsFullyCovered(game, team1Spec, newlyCovered)) {
    teamsDone.push('1')
  }
  if (specAgentsFullyCovered(game, team2Spec, newlyCovered)) {
    teamsDone.push('2')
  }
  return teamsDone
}

const specAgentsFullyCovered = (game: Game, spec: TeamBoardSpec, newlyCovered: { [cellKey: string]: CellCoverEvent }): boolean => {
  const uncoveredCell = spec.specCardCells
    .filter(c => c.cell_type === 'agent')
    .find(c => {
      const cover = game.board[getCellIdx(c)].covered
      const newCover = newlyCovered[getCellKey(c)]?.newCover
      const covered = (cover && TEAMS.includes(cover as Team)) || (newCover && TEAMS.includes(newCover as Team))
      return !covered
    })
  return !uncoveredCell
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
