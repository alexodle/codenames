import { FunctionComponent, SyntheticEvent, useEffect, useState } from "react";
import { GetGamePlayerViewRequest, PutGuessRequest, PutHintRequest, PutPassRequest } from "../types/api";
import { GameBoardCell, GameTurn, Player, SpecCardCell, Team } from "../types/model";
import { TWO_PLAYER_TURNS, COLS, ROWS } from "../util/constants";
import { createDataFetcher, createDataSender, useDataFetcher } from "../util/dataFetcher";
import { capitalize, getCellKey, getOtherTeam, isValidHintQuick, keyBy, range } from "../util/util";
import { Input, Label, Option, PrimaryButton, Select } from "./form";
import { useGameContext } from "./GameContext";
import { WordCard } from "./WordCard"

const HINT_NUM_RANGE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => n.toString())

const RANDOM_ANIM_SECONDS = range(ROWS * COLS).map(() => Math.random() * 0.5 + 0.2)

interface CodeMasterHintInputViewProps { }
const CodeMasterHintInputView: FunctionComponent<CodeMasterHintInputViewProps> = () => {
  const { game, gameInvalidated, invalidateGame, validateGame } = useGameContext()

  const [setHintState, setFetcher] = useDataFetcher(undefined, false)
  useEffect(() => {
    if (setHintState.error) {
      validateGame()
    }
  }, [setHintState.error])

  const [hint, setHint] = useState('')
  const [hintNum, setHintNum] = useState('1')

  const submitHint = (ev: SyntheticEvent) => {
    ev.preventDefault()
    invalidateGame()
    setFetcher(createDataSender<{}, PutHintRequest>(`${process.env.API_BASE_URL}/api/game/${game.id}}/hint`, 'PUT', {
      turnNum: game.current_turn_num!,
      hint: hint.trim(),
      hintNum: parseInt(hintNum, 10),
    }))
  }

  const wordConflict = setHintState.error?.message.startsWith('InvalidHint')
  const invalidHint = wordConflict || !isValidHintQuick(hint)
  const invalidHintError = !!hint.length && invalidHint
  return (
    <div className='codemaster-input'>
      <Label htmlFor='hint'>
        Hint:
        {invalidHintError ? <span className='input-error'>Invalid hint{wordConflict ? ' - too close to a word on the board' : undefined}</span> : undefined}
        <Input
          id='hint'
          name='hint'
          placeholder='Hint'
          className='hint-input'
          error={invalidHintError}
          value={hint}
          disabled={gameInvalidated}
          onChange={ev => {
            setHint(ev.target.value);
            setFetcher(undefined);
          }}
        />
      </Label>
      <Label htmlFor='hintNum'>
        Amount:
        <Select
          id='hintNum'
          name='hintNum'
          className='hint-input'
          value={hintNum}
          disabled={gameInvalidated}
          onChange={ev => setHintNum(ev.target.value)}
        >
          {HINT_NUM_RANGE.map(n => <Option key={n} value={n}>{n}</Option>)}
        </Select>
      </Label>
      <PrimaryButton className='submit-hint-btn' onClick={submitHint} disabled={gameInvalidated || invalidHint}>Submit hint</PrimaryButton>
      <style>
        {`
          .submit-hint-btn {
            width: 100%;
          }
          .hint-input {
            width: 100%;
          }
        `}
      </style>
    </div>
  )
}

interface SpectatorViewProps {
  currentTurn: GameTurn
}
const SpectatorView: FunctionComponent<SpectatorViewProps> = ({ currentTurn }) => (
  <div className='spectator-view'>
    <h3>Hint</h3>
    {currentTurn.hint_word ? (
      <p className='hint'>{currentTurn.hint_word} - {currentTurn.hint_num}</p>
    ) : undefined}
    {!currentTurn.hint_word ? (
      <p>Waiting for other player...</p>
    ) : undefined}
    <style jsx>
      {`
        .hint {
          font-weight: bold;
          font-size: 120%;
          border: 1px solid gray;
          border-radius: 10px;
          text-align: center;
          padding: 10px;
        }
      `}
    </style>
  </div>
)

interface GameOverViewProps {
  winning_team?: Team
}
const GameOverView: FunctionComponent<GameOverViewProps> = ({ winning_team }) => {
  if (winning_team) {
    return (
      <h2 className='celebration'>
        YOU WON!!
      </h2>
    )
  }
  return (
    <h2 className='lost'>
      YOU LOST :(
    </h2>
  )
}

interface TurnsViewProps {
  turnNum: number
}
const TurnsView: FunctionComponent<TurnsViewProps> = ({ turnNum }) => (
  <ol className='turns-view'>
    {range(TWO_PLAYER_TURNS - turnNum + 1, 1).map(n => (
      <li key={n} className='turn-box' />
    ))}
    <style jsx>
      {`
        .turns-view {
          list-style-type: none;
          height: 100%;
          padding: 0;
          margin: 0;
          border: 1px solid gray;
          border-radius: 10px;
        }
        .turn-box {
          padding: 0;
          width: 0;
          margin-left: 4px;
          margin-top: 20px;
          width: 30px;
          height: 30px;
          background-color: gray;
        }
      `}
    </style>
  </ol>
)

export interface GamePlayProps {
  myPlayer: Player
}
export const GamePlay: FunctionComponent<GamePlayProps> = ({ myPlayer }) => {
  const { game, gameInvalidated, invalidateGame } = useGameContext()

  const myGamePlayer = game.players.find(p => p.player_id === myPlayer.id)!
  const isCodeMaster = myGamePlayer.player_type === 'codemaster'
  const codemasterDataFetcher = isCodeMaster ? createDataFetcher<GetGamePlayerViewRequest>(`${process.env.API_BASE_URL}/api/game/${game.id}/player`) : undefined
  const [codemasterViewState] = useDataFetcher(codemasterDataFetcher, isCodeMaster)

  let cellSpecs: { [key: string]: SpecCardCell }
  if (codemasterViewState.data) {
    cellSpecs = keyBy(codemasterViewState.data.teamBoardSpec.specCardCells, getCellKey)
  }

  const currentTurn = game.currentTurn!
  const isMyTurn = myGamePlayer.team === game.currentTurn!.team
  const isGuessing = !game.game_over && ((isMyTurn && !isCodeMaster) || (game.game_type === '2player' && !isMyTurn)) && !!currentTurn.hint_word
  const isLastTurn = game.game_type === '2player' && currentTurn.turn_num === TWO_PLAYER_TURNS

  const [, setGuessFetcher] = useDataFetcher(undefined, false)
  const onCellClick = (ev: SyntheticEvent, cell: GameBoardCell) => {
    ev.preventDefault()
    invalidateGame()
    setGuessFetcher(createDataSender<{}, PutGuessRequest>(`${process.env.API_BASE_URL}/api/game/${game.id}/guess`, 'PUT', {
      turnNum: currentTurn.turn_num,
      guessNum: currentTurn.guesses.length,
      row: cell.row,
      col: cell.col,
    }))
  }

  const onPass = (ev: SyntheticEvent) => {
    ev.preventDefault()
    invalidateGame()
    setGuessFetcher(createDataSender<{}, PutPassRequest>(`${process.env.API_BASE_URL}/api/game/${game.id}/pass`, 'PUT', { turnNum: currentTurn.turn_num }))
  }

  const otherTeam = getOtherTeam(myGamePlayer.team)
  return (
    <div>
      <div className={`game-container ${game.game_type === '2player' ? 'two-player' : undefined}`}>
        {game.game_over ? <GameOverView winning_team={game.winning_team} /> : undefined}
        <ol className={`board ${game.game_over ? 'game-over' : ''}`}>
          {game.board.map((cell, i) => {
            const key = getCellKey(cell)
            const cellSpec = cellSpecs && cellSpecs[key]

            const isFullCitizenCover = cell.covered === 'citizen' && cell.covered_citizen_team === 'full'
            const isMyCitizenCover = cell.covered === 'citizen' && cell.covered_citizen_team === myGamePlayer.team
            const isOtherCitizenCover = cell.covered === 'citizen' && cell.covered_citizen_team === otherTeam

            const clickable = !gameInvalidated && isGuessing && (!cell.covered || isOtherCitizenCover)
            return (
              <WordCard
                key={key}
                word={cell.word}
                clickable={clickable}
                animationSeconds={RANDOM_ANIM_SECONDS[i]}
                onClick={ev => onCellClick(ev, cell)}
              >
                {cellSpec && cellSpec.cell_type !== 'citizen' ? (
                  <span className={`cell-type ${cellSpec.cell_type || ''}`}>
                    {cellSpec.cell_type ? capitalize(cellSpec.cell_type) : ''}
                  </span>
                ) : undefined}

                {cell.covered === '1' || cell.covered === '2' ? <span className='cover cover-agent' /> : undefined}

                {cell.covered === 'assassin' || isFullCitizenCover ? <span className={`cover cover-${cell.covered}`} /> : undefined}

                {isMyCitizenCover ? <span className={`partial-cover cover-citizen-mine`}>YOU</span> : undefined}
                {isOtherCitizenCover ? <span className={`partial-cover cover-citizen-other`}>THEM</span> : undefined}
              </WordCard>
            )
          })}
        </ol>
        {game.game_type === '2player' ? <TurnsView turnNum={currentTurn.turn_num} /> : undefined}
      </div>
      {isGuessing ? <PrimaryButton onClick={onPass} disabled={gameInvalidated || isLastTurn}>Pass</PrimaryButton> : undefined}
      {isMyTurn && currentTurn.hint_word ? <p>Waiting for other player to guess...</p> : undefined}
      <hr />
      {!game.game_over ?
        isCodeMaster && isMyTurn && !currentTurn.hint_word ?
          <CodeMasterHintInputView /> :
          <SpectatorView currentTurn={currentTurn} />
        : undefined
      }
      <style jsx>
        {`
          .game-container.two-player {
            display: grid;
            grid-template-columns: 1fr 40px;
            column-gap: 10px;
          }

          .board {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
            column-gap: 10px;
            row-gap: 10px;
            list-style-type: none;
            margin: 0;
            padding: 0;
            padding: 10px;
            border: 1px solid gray;
            border-radius: 10px;
            overflow: hidden;
          }
          .board.game-over {
            background-color: #E8E8E8;
          }
          .codemaster-loading {
            background-color: #E8E8E8;
          }

          .cell-type {
            position: absolute;
            display: block;
            top: 5px;
            right: 5px;
            width: 30px;
            height: 30px;
            font-size: 50%;
            line-height: 30px;
            color: white;
          }
          .cell-type.assassin {
            background-color: #000000;
          }
          .cell-type.agent {
            background-color: green;
          }

          .cover {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.5;
          }
          .cover-agent {
            background-color: green;
          }
          .cover-assassin {
            background-color: black;
          }
          .cover-citizen {
            background-color: gray;
          }

          .partial-cover {
            position: absolute;
            top: 5px;
            left: 5px;
            width: 30px;
            height: 30px;
            opacity: 0.75;
            font-size: 50%;
            line-height: 30px;
            color: white;
          }
          .cover-citizen-other, .cover-citizen-mine {
            background-color: gray;
          }

          hr {
            padding: 0;
            margin-top: 30px;
            margin-bottom: 10px;
            border: 0.5px solid gray;
          }
        `}
      </style>
    </div>
  )
}
