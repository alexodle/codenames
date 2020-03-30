import { asTeam, CellType, CoveredCitizenTeam, CoverType, Game, GameBoardCell, GameEvent, SpecCardCell, Team, TeamBoardSpec } from '../types/model';
import { COLS, ROWS, TWO_PLAYER_TURNS } from '../util/constants';
import { processGuess2Player, processPass } from './guess';

const create2PlayerGame = (rep: string, { turnNum = 1, turnTeam = '1' }): Game => {
  const convertCellCover = (c: string): CoverType | undefined => {
    switch (c) {
      case 'A': return '1'
      case 'X': return 'assassin'
      case 'Z': return 'citizen'
    }
    return undefined
  }
  const convertCitizenTeam = (c: string): CoveredCitizenTeam | undefined => {
    switch (c) {
      case '1': return '1'
      case '2': return '2'
      case 'X': return 'full'
    }
    return undefined
  }
  const cells: GameBoardCell[] = rep.replace(/\s/g, '').split('').map((c, i) => ({
    game_id: 1,
    row: Math.floor(i / ROWS),
    col: i % COLS,
    word: 'word',
    covered: convertCellCover(c),
    covered_citizen_team: convertCitizenTeam(c),
  }))
  return {
    id: 1,
    created_on: new Date(),
    created_by_player_id: 1,
    is_started: true,
    current_turn_num: turnNum,
    game_type: '2player',
    winning_team: undefined,
    game_over: false,
    players: [
      {
        game_id: 1,
        player_id: 1,
        team: '1',
        player_type: 'codemaster',
        player: { id: 1, name: 'Alex', sub: 'alex' }
      },
      {
        game_id: 2,
        player_id: 2,
        team: '2',
        player_type: 'codemaster',
        player: { id: 2, name: 'Kara', sub: 'kara' }
      },
    ],
    currentTurn: {
      game_id: 1,
      turn_num: turnNum,
      team: asTeam(turnTeam),
      guesses: [],
      hint_word: 'hint',
      hint_num: 1,
      allow_pass: true,
    },
    board: cells,
  }
}

const createBoardSpec = (team: Team, rep: string): TeamBoardSpec => {
  const convert = (c: string): CellType => {
    switch (c) {
      case 'A': return 'agent'
      case 'X': return 'assassin'
      case 'Z': return 'citizen'
    }
    throw new Error(`Unrecognized char: ${c}`)
  }
  const specCardCells: SpecCardCell[] = rep.replace(/\s/g, '').split('').map((c, i) => ({
    spec_card_id: i,
    side: 'front',
    row: Math.floor(i / ROWS),
    col: i % COLS,
    cell_type: convert(c),
  }))
  return {
    team,
    spec_card_id: 1,
    spec_card_side: 'front',
    specCardCells,
  }
}

describe('processGuess2Player', () => {

  test('continues turn for first agent guess', () => {
    const game = create2PlayerGame(`
      -----
      -----
      -----
      -----
      -----`, {})
    const boardSpec1 = createBoardSpec('1', `
      AAAAA
      AAAAX
      XXZZZ
      ZZZZZ
      ZZZZZ`)
    const boardSpec2 = createBoardSpec('2', `
      AAAZZ
      ZZZZZ
      ZXXXA
      AAAAA
      ZZZZZ`)
    const events = processGuess2Player(game, [boardSpec1, boardSpec2], game.players[1], { game_id: 1, turn_num: 1, guess_num: 1, row: 0, col: 0 })
    const expected: GameEvent[] = [
      { type: 'guess', turnNum: 1, guessNum: 1, row: 0, col: 0 },
      { type: 'cover', newCover: '1', turnNum: 1, row: 0, col: 0 },
    ]
    expect(events).toStrictEqual(expected)
  })

  test('changes turn on citizen guess', () => {
    const game = create2PlayerGame(`
      -----
      -----
      -----
      -----
      -----`, {})
    const boardSpec1 = createBoardSpec('1', `
      AAAAA
      AAAAX
      XXZZZ
      ZZZZZ
      ZZZZZ`)
    const boardSpec2 = createBoardSpec('2', `
      AAAZZ
      ZZZZZ
      ZXXXA
      AAAAA
      ZZZZZ`)
    const events = processGuess2Player(game, [boardSpec1, boardSpec2], game.players[1], { game_id: 1, turn_num: 1, guess_num: 1, row: 3, col: 4 })
    const expected: GameEvent[] = [
      { type: 'guess', turnNum: 1, guessNum: 1, row: 3, col: 4 },
      { type: 'cover', newCover: 'citizen', newCoverCitizenTeam: '2', turnNum: 1, row: 3, col: 4 },
      { type: 'nextturn', nextTurnNum: 2, nextTeam: '2', nextTurnAllowPass: true },
    ]
    expect(events).toStrictEqual(expected)
  })

  test('game over if guess citizen on last turn', () => {
    const game = create2PlayerGame(`
      -----
      -----
      -----
      -----
      -----`, { turnNum: TWO_PLAYER_TURNS })
    const boardSpec1 = createBoardSpec('1', `
      AAAAA
      AAAAX
      XXZZZ
      ZZZZZ
      ZZZZZ`)
    const boardSpec2 = createBoardSpec('2', `
      AAAZZ
      ZZZZZ
      ZXXXA
      AAAAA
      ZZZZZ`)
    const events = processGuess2Player(game, [boardSpec1, boardSpec2], game.players[1], { game_id: 1, turn_num: TWO_PLAYER_TURNS, guess_num: 1, row: 3, col: 4 })
    const expected: GameEvent[] = [
      { type: 'guess', turnNum: TWO_PLAYER_TURNS, guessNum: 1, row: 3, col: 4 },
      { type: 'cover', newCover: 'citizen', newCoverCitizenTeam: '2', turnNum: TWO_PLAYER_TURNS, row: 3, col: 4 },
      { type: 'gameover', turnNum: TWO_PLAYER_TURNS },
    ]
    expect(events).toStrictEqual(expected)
  })

  test('do not allow pass for last turn', () => {
    const game = create2PlayerGame(`
      -----
      -----
      -----
      -----
      -----`, { turnNum: TWO_PLAYER_TURNS - 1 })
    const boardSpec1 = createBoardSpec('1', `
      AAAAA
      AAAAX
      XXZZZ
      ZZZZZ
      ZZZZZ`)
    const boardSpec2 = createBoardSpec('2', `
      AAAZZ
      ZZZZZ
      ZXXXA
      AAAAA
      ZZZZZ`)
    const events = processGuess2Player(game, [boardSpec1, boardSpec2], game.players[1], { game_id: 1, turn_num: TWO_PLAYER_TURNS - 1, guess_num: 1, row: 3, col: 4 })
    const expected: GameEvent[] = [
      { type: 'guess', turnNum: TWO_PLAYER_TURNS - 1, guessNum: 1, row: 3, col: 4 },
      { type: 'cover', newCover: 'citizen', newCoverCitizenTeam: '2', turnNum: TWO_PLAYER_TURNS - 1, row: 3, col: 4 },
      { type: 'nextturn', nextTurnNum: TWO_PLAYER_TURNS, nextTeam: '2', nextTurnAllowPass: false },
    ]
    expect(events).toStrictEqual(expected)
  })

  test('do not change turn if other player is done', () => {
    const game = create2PlayerGame(`
      AAAAA
      AAAA-
      -----
      -----
      -----`, { turnNum: 2, turnTeam: '2' })
    const boardSpec1 = createBoardSpec('1', `
      AAAAA
      AAAAX
      XXZZZ
      ZZZZZ
      ZZZZZ`)
    const boardSpec2 = createBoardSpec('2', `
      AAAZZ
      ZZZZZ
      ZXXXA
      AAAAA
      ZZZZZ`)
    const events = processGuess2Player(game, [boardSpec1, boardSpec2], game.players[0], { game_id: 1, turn_num: 2, guess_num: 1, row: 4, col: 4 })
    const expected: GameEvent[] = [
      { type: 'guess', turnNum: 2, guessNum: 1, row: 4, col: 4 },
      { type: 'cover', newCover: 'citizen', newCoverCitizenTeam: '1', turnNum: 2, row: 4, col: 4 },
      { type: 'nextturn', nextTurnNum: 3, nextTeam: '2', nextTurnAllowPass: true },
    ]
    expect(events).toStrictEqual(expected)
  })

  // Also allows you to go over the max number of turns
  test('next turn if player guesses last agent', () => {
    const game = create2PlayerGame(`
      AAAAA
      AAA--
      -----
      -----
      -----`, { turnNum: TWO_PLAYER_TURNS })
    const boardSpec1 = createBoardSpec('1', `
      AAAAA
      AAAAX
      XXZZZ
      ZZZZZ
      ZZZZZ`)
    const boardSpec2 = createBoardSpec('2', `
      AAAZZ
      ZZZZZ
      ZXXXA
      AAAAA
      ZZZZZ`)
    const events = processGuess2Player(game, [boardSpec1, boardSpec2], game.players[1], { game_id: 1, turn_num: TWO_PLAYER_TURNS, guess_num: 1, row: 1, col: 3 })
    const expected: GameEvent[] = [
      { type: 'guess', turnNum: TWO_PLAYER_TURNS, guessNum: 1, row: 1, col: 3 },
      { type: 'cover', newCover: '1', turnNum: TWO_PLAYER_TURNS, row: 1, col: 3 },
      { type: 'nextturn', nextTurnNum: TWO_PLAYER_TURNS + 1, nextTeam: '2', nextTurnAllowPass: false },
    ]
    expect(events).toStrictEqual(expected)
  })

  test('game over for win', () => {
    const game = create2PlayerGame(`
      -AAAA
      AAAA-
      ----A
      AAAAA
      -----`, {})
    const boardSpec1 = createBoardSpec('1', `
      AAAAA
      AAAAX
      XXZZZ
      ZZZZZ
      ZZZZZ`)
    const boardSpec2 = createBoardSpec('2', `
      AAAZZ
      ZZZZZ
      ZXXXA
      AAAAA
      ZZZZZ`)
    const events = processGuess2Player(game, [boardSpec1, boardSpec2], game.players[1], { game_id: 1, turn_num: 1, guess_num: 1, row: 0, col: 0 })
    const expected: GameEvent[] = [
      { type: 'guess', turnNum: 1, guessNum: 1, row: 0, col: 0 },
      { type: 'cover', newCover: '1', turnNum: 1, row: 0, col: 0 },
      { type: 'gameover', turnNum: 1, winner: '1' },
    ]
    expect(events).toStrictEqual(expected)
  })

})

describe('pass', () => {
  test('processes pass', () => {
    const game = create2PlayerGame(`
      -----
      -----
      -----
      -----
      -----`, {})
    const boardSpec1 = createBoardSpec('1', `
      AAAAA
      AAAAX
      XXZZZ
      ZZZZZ
      ZZZZZ`)
    const boardSpec2 = createBoardSpec('2', `
      AAAZZ
      ZZZZZ
      ZXXXA
      AAAAA
      ZZZZZ`)
    const events = processPass(game, [boardSpec1, boardSpec2], game.players[1], 1)
    const expected: GameEvent[] = [
      { type: 'pass', turnNum: 1 },
      { type: 'nextturn', nextTeam: '2', nextTurnNum: 2, nextTurnAllowPass: true },
    ]
    expect(events).toStrictEqual(expected)
  })

  test('throws if passing on last turn in 2 player', () => {
    const game = create2PlayerGame(`
      -----
      -----
      -----
      -----
      -----`, { turnNum: TWO_PLAYER_TURNS })
    const boardSpec1 = createBoardSpec('1', `
      AAAAA
      AAAAX
      XXZZZ
      ZZZZZ
      ZZZZZ`)
    const boardSpec2 = createBoardSpec('2', `
      AAAZZ
      ZZZZZ
      ZXXXA
      AAAAA
      ZZZZZ`)

    expect(() =>
      processPass(game, [boardSpec1, boardSpec2], game.players[1], TWO_PLAYER_TURNS))
      .toThrow()
  })

  test('throws if passing when other player is done', () => {
    const game = create2PlayerGame(`
      AAAAA
      AAAA-
      -----
      -----
      -----`, { turnNum: 2, turnTeam: '2' })
    const boardSpec1 = createBoardSpec('1', `
      AAAAA
      AAAAX
      XXZZZ
      ZZZZZ
      ZZZZZ`)
    const boardSpec2 = createBoardSpec('2', `
      AAAZZ
      ZZZZZ
      ZXXXA
      AAAAA
      ZZZZZ`)
    expect(() =>
      processPass(game, [boardSpec1, boardSpec2], game.players[0], 2))
      .toThrow()
  })

})
