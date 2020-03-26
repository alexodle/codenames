import { FunctionComponent, SyntheticEvent, useEffect, useState } from "react";
import { GetGamePlayerViewRequest, PutGuessRequest, PutHintRequest, PutPassRequest } from "../types/api";
import { GameBoardCell, GameTurn, Player, Team } from "../types/model";
import { TWO_PLAYER_TURNS } from "../util/constants";
import { createDataFetcher, createDataSender, useDataFetcher } from "../util/dataFetcher";
import { isValidHintQuick, range } from "../util/util";
import { Board } from "./Board";
import { CitizenLabel } from "./CardLabel";
import { Input, Label, Option, PrimaryButton, Select } from "./form";
import { useGameContext } from "./GameContext";

const HINT_NUM_RANGE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => n.toString())

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
          fullWidth
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
          fullWidth
          value={hintNum}
          disabled={gameInvalidated}
          onChange={ev => setHintNum(ev.target.value)}
        >
          {HINT_NUM_RANGE.map(n => <Option key={n} value={n}>{n}</Option>)}
        </Select>
      </Label>
      <PrimaryButton fullWidth onClick={submitHint} disabled={gameInvalidated || invalidHint}>Submit hint</PrimaryButton>
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
  winningTeam?: Team
}
const GameOverView: FunctionComponent<GameOverViewProps> = ({ winningTeam }) => {
  if (winningTeam) {
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
const TurnsView: FunctionComponent<TurnsViewProps> = ({ children, turnNum }) => (
  <div className='turns-view'>
    {range(TWO_PLAYER_TURNS - turnNum + 1, 1).map(n => (
      <div key={n} className='citizen'><CitizenLabel /></div>
    ))}
    {children}
    <style jsx>
      {`
        .turns-view {
          position: relative;
          height: 100%;
          padding: 0;
          margin: 0;
          border: 1px solid gray;
          border-radius: 10px;
        }
        .citizen {
          margin-left: 5px;
          padding-top: 30px;
        }
      `}
    </style>
  </div>
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

  const specCardCells = codemasterViewState.data?.teamBoardSpec.specCardCells

  const currentTurn = game.currentTurn!
  const isMyTurn = myGamePlayer.team === game.currentTurn!.team
  const isGuessing = !game.game_over && ((isMyTurn && !isCodeMaster) || (game.game_type === '2player' && !isMyTurn)) && !!currentTurn.hint_word

  const [, setGuessFetcher] = useDataFetcher(undefined, false)
  const onCellClick = (cell: GameBoardCell) => {
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

  return (
    <div>
      {game.game_over ? <GameOverView winningTeam={game.winning_team} /> : undefined}
      <div className={`game-container ${game.game_type === '2player' ? 'two-player' : undefined}`}>
        <Board myGamePlayer={myGamePlayer} specCardCells={specCardCells} isGuessing={isGuessing} onCellClick={onCellClick} />
        {game.game_type === '2player' ? (
          <TurnsView turnNum={currentTurn.turn_num}>
            {game.game_over ? <span className='game-over-cover' /> : undefined}
          </TurnsView>
        ) : undefined}
      </div>
      {isMyTurn && currentTurn.hint_word ? <p>Waiting for other player to guess...</p> : undefined}

      <hr />

      {
        !game.game_over ?
          isCodeMaster && isMyTurn && !currentTurn.hint_word ?
            <CodeMasterHintInputView /> :
            <SpectatorView currentTurn={currentTurn} />
          : undefined
      }

      {isGuessing ? <PrimaryButton fullWidth onClick={onPass} disabled={gameInvalidated || !currentTurn.allow_pass}>Pass</PrimaryButton> : undefined}

      <style jsx>
        {`
          .game-container.two-player {
            display: grid;
            grid-template-columns: 1fr 40px;
            column-gap: 10px;
          }
        `}
      </style>
    </div >
  )
}
