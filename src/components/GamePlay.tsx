import { FunctionComponent, SyntheticEvent, useState } from "react";
import { GetGamePlayerViewRequest, PutHintRequest, PutGuessRequest } from "../types/api";
import { Game, Player, SpecCardCell, GameTurn, GameBoardCell } from "../types/model";
import { createDataFetcher, createDataSender, useDataFetcher } from "../util/dataFetcher";
import { keyBy, getOtherTeam } from "../util/util";

const HINT_NUM_RANGE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => n.toString())

const cellKey = (c: { row: number, col: number }): string => `${c.row}:${c.col}`

interface CodeMasterHintInputViewProps {
  game: Game
  myURL: string
}
const CodeMasterHintInputView: FunctionComponent<CodeMasterHintInputViewProps> = ({ game, myURL }) => {
  const [setHintState, setFetcher] = useDataFetcher(myURL, undefined, false)

  const [hint, setHint] = useState('')
  const [hintNum, setHintNum] = useState('1')

  const submitHint = (ev: SyntheticEvent) => {
    ev.preventDefault()
    setFetcher(createDataSender<{}, PutHintRequest>(`${process.env.API_BASE_URL}/api/game/${game.id}}/hint`, 'PUT', {
      turnNum: game.current_turn_num!,
      hint,
      hintNum: parseInt(hintNum, 10),
    }))
  }

  return (
    <div className='codemaster-input'>
      <label htmlFor='hint'>
        Hint: <input id='hint' name='hint' placeholder='Hint' value={hint} onChange={ev => setHint(ev.target.value)} disabled={setHintState.isLoading} />
      </label>
      <label htmlFor='hintNum'>
        Amount: <select id='hintNum' name='hintNum' value={hintNum} onChange={ev => setHintNum(ev.target.value)} disabled={setHintState.isLoading}>
          {HINT_NUM_RANGE.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <button type='submit' onClick={submitHint} disabled={!hint.length || setHintState.isLoading}>Submit hint</button>
      <style jsx>
        {`
          input, select, button {
            font-size: 130%;
            border: 1px solid gray;
            border-radius: 5px;
            width: 100%;
            padding: 10px;
          }
          label {
            display: block;
            margin-bottom: 20px;
            margin-top: 20px;
          }
          button {
            cursor: pointer;
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
    <h2>Hint:</h2>
    {currentTurn.hint_word ? (
      <p>
        <span className='hint'>{currentTurn.hint_word}</span>
        {' '}<span className='hint-num'>{currentTurn.hint_num}</span>
      </p>
    ) : undefined}
    {!currentTurn.hint_word ? (
      <p>Waiting...</p>
    ) : undefined}
    <style jsx>
      {`
        .hint {
          font-weight: bold;
        }
      `}
    </style>
  </div>
)

export interface GamePlayProps {
  game: Game
  myURL: string
  myPlayer: Player
}

export const GamePlay: FunctionComponent<GamePlayProps> = ({ game, myURL, myPlayer }) => {
  const myGamePlayer = game.players.find(p => p.player_id === myPlayer.id)!

  const isCodeMaster = myGamePlayer.player_type === 'codemaster'
  const codemasterDataFetcher = isCodeMaster ? createDataFetcher<GetGamePlayerViewRequest>(`${process.env.API_BASE_URL}/api/game/${game.id}/player`) : undefined
  const [codemasterViewState] = useDataFetcher(myURL, codemasterDataFetcher, isCodeMaster)

  let cellTypes: { [key: string]: SpecCardCell }
  if (codemasterViewState.data) {
    cellTypes = keyBy(codemasterViewState.data.teamBoardSpec.specCardCells, cellKey)
  }

  const currentTurn = game.currentTurn!
  const isMyTurn = myGamePlayer.team === game.currentTurn!.team
  const isGuessing = ((isMyTurn && !isCodeMaster) || (game.game_type === '2player' && !isMyTurn)) && currentTurn.hint_word

  const [guessState, setGuessFetcher] = useDataFetcher(myURL, undefined, false)
  const onCellClick = (ev: SyntheticEvent, cell: GameBoardCell) => {
    ev.preventDefault()
    setGuessFetcher(createDataSender<{}, PutGuessRequest>(`${process.env.API_BASE_URL}/api/game/${game.id}/guess`, 'PUT', {
      turnNum: currentTurn.turn_num,
      guessNum: currentTurn.guesses.length,
      row: cell.row,
      col: cell.col,
    }))
  }

  const otherTeam = getOtherTeam(myGamePlayer.team)
  return (
    <div>
      <h1>Codenames</h1>
      <ol className='board'>
        {game.board.map(cell => {
          const key = cellKey(cell)
          const cellType = cellTypes && cellTypes[key]

          const isFullCitizenCover = cell.covered === 'citizen' && cell.covered_citizen_team === 'full'
          const isMyCitizenCover = cell.covered === 'citizen' && cell.covered_citizen_team === myGamePlayer.team
          const isOtherCitizenCover = cell.covered === 'citizen' && cell.covered_citizen_team === otherTeam

          const clickable = !guessState.isLoading && isGuessing && (!cell.covered || isOtherCitizenCover)
          return (
            <li
              key={key}
              className={`board-cell ${clickable ? 'clickable' : ''} ${codemasterViewState.isLoading ? 'codemaster-loading' : ''}`}
              onClick={clickable ? ev => onCellClick(ev, cell) : undefined}
            >
              {cellType && cellType.cell_type !== 'citizen' ? <span className={`cell-type ${cellType.cell_type || ''}`} /> : undefined}

              {cell.covered === '1' || cell.covered === '2' ? <span className='cover cover-agent' /> : undefined}

              {cell.covered === 'assassin' || isFullCitizenCover ? <span className={`cover cover-${cell.covered}`} /> : undefined}

              {isMyCitizenCover ? <span className={`partial-cover cover-citizen-mine`}>YOU</span> : undefined}
              {isOtherCitizenCover ? <span className={`partial-cover cover-citizen-other`}>THEM</span> : undefined}

              <span className='cell-word'>{cell.word}</span>
            </li>
          )
        })}
      </ol>
      <hr />
      {isCodeMaster && isMyTurn && !currentTurn.hint_word ?
        <CodeMasterHintInputView game={game} myURL={myURL} /> :
        <SpectatorView currentTurn={currentTurn} />
      }
      <style jsx>
        {`
          .board {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
            column-gap: 10px;
            row-gap: 10px;
            list-style-type: none;
            margin: 0;
            padding: 0;
          }
          .board-cell {
            border: 1px solid gray;
            border-radius: 10px;
            text-align: center;
            height: 100px;
            position: relative;
          }
          .cell-word {
            line-height: 100px;
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
            opacity: 0.75;
          }
          .cell-type.assassin {
            background-color: black;
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
            font-weight: bold;
            line-height: 30px;
          }
          .cover-citizen-other, .cover-citizen-mine {
            background-color: gray;
          }
        `}
      </style>
    </div>
  )
}
