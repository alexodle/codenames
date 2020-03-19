# Tables

## user
id
name

## board_spec_card
card_id
side (front|back)
row
col
cell (assassin|citizen|agent)

## word_card
word

## game
id
current_turn_num
game_type (4player|2player)
winning_team? (1|2)

## game_score
game_id
team (1|2)
score

## game_player
user_id
game_id
team (1|2)
player_type (guesser|codemaster)

## game_team_board_spec
game_id
team (1|2)
board_spec_card_id
board_spec_card_side

## game_board_state
game_id
row
col
word
covered? (assassin|citizen|1|2)

## game_turn
game_id
turn_num
team (1|2)
hint_word?
hint_num?

## game_turn_guesses
game_id
turn_num
guess_num
row
col


## Pseudocode (combining client/server logic all here)

```
RenderBoard(game_board_state)
  game_board_state.forEach(({ row, col, word, covered, covered }) => {
    renderCell(row, col, word, covered)
  })

RenderUserCodeMasterView(game_player, game_turn)
  game_player.game_team_spec.forEach(({ row, col, cell }) => {
    renderSpecCell(row, col, cell)
  })

  if (!game_turn.hint_word) {
    onSubmitHint((hint_word, hint_num) => {
      game_turn.update({ hint_word, hint_num })
    })
  }

RenderGuesserView(game_board_state, game_player, game_turn, guess_num)
  if (!game_turn.hint_word) "Waiting..."

  game_board_state.forEach(({ row, col, word, covered, covered }) => {
    renderCell(row, col, word, covered, { guessable: !covered })
  })

  onSubmitGuess((row, col) => {
    BEGIN TRANSACTION

    game_turn_guesses.add({ game_id, turn_num: game_turn.turn_num, guess_num, row, col })

    const otherTeam = game_player.team === 1 ? 2 : 1
    const myCellSpec = game_team_spec(game_id, game_player.team, row, col)
    const otherCellSpec = game_team_spec(game_id, otherTeam, row, col)

    if (myCellSpec.cell === 'assassin' || otherCellSpec === 'assasin') {
      game_board_state.update({ game_id, col, row }, { covered: 'assassin' })
      game.update({ id: game_id }, { winning_team: otherTeam })
      return
    } else {
      if (myCellSpec.cell === 'agent' || otherCellSpec.cell === 'agent') {
        const team = myCellSpec.cell === 'agent' ? game_player.team : otherTeam
        game_board_state.update({ game_id, col, row }, { covered: team })
        game_score.inc({ game_id, team }, 'score')
      } else if (myCellSpec.cell === 'citizen') {
        game_board_state.update({ game_id, col, row }, { covered: 'citizen' })
      }
    }

    scores1, scores2 = scores(game_id)
    game = game(game_id)
    if (game.game_type === '2player' && scores1 + scores2 === TOTAL) {
      game.update({ id: game_id }, { winning_team: otherTeam })
    } else if (myCellSpec.cell !== 'agent') {
      game_turn.add({ game_id, turn_num: game_turn.turn_num+1, otherTeam })
      game.update({ id: game_id }, { current_turn_num: game_turn.turn_num+1 })
    }

    END TRANSACTION
  })

  onPass(() => {
    const otherTeam = game_player.team === 1 ? 2 : 1
    game_turn.add({ game_id, turn_num: game_turn.turn_num+1, otherTeam })
    game.update({ id: game_id }, { current_turn_num: game_turn.turn_num+1 })
  })
```
