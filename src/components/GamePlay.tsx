import { FunctionComponent, SyntheticEvent, useEffect, useState } from "react";
import { GetGamePlayerViewRequest, PutGuessRequest, PutHintRequest, PutPassRequest } from "../types/api";
import { GameBoardCell, GameTurn, Player, Team, CellType } from "../types/model";
import { COLS, ROWS, TWO_PLAYER_TURNS } from "../util/constants";
import { createDataFetcher, createDataSender, useDataFetcher } from "../util/dataFetcher";
import { getCellKey, getOtherTeam, isValidHintQuick, keyBy, range } from "../util/util";
import { CardCover } from "./CardCover";
import { CitizenLabel } from "./CardLabel";
import { Input, Label, Option, PrimaryButton, Select } from "./form";
import { useGameContext } from "./GameContext";
import { WordCard } from "./WordCard";

const HINT_NUM_RANGE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => n.toString())

const CARD_DEAL_DELAY_MILLIS = 10

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
  <div className='turns-view'>
    {range(TWO_PLAYER_TURNS - turnNum + 1, 1).map(n => (
      <div key={n} className='citizen'><CitizenLabel /></div>
    ))}
    <style jsx>
      {`
        .turns-view {
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
  const cellSpecs = specCardCells ? keyBy(specCardCells, getCellKey) : undefined

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

  const totalCards = ROWS * COLS
  const [nCardsShown, setNCardsShown] = useState(0)
  const [intervalID, setIntervalID] = useState<NodeJS.Timeout | undefined>(undefined)
  useEffect(() => {
    const clearIntervalID = () => {
      if (intervalID) {
        clearInterval(intervalID)
        setIntervalID(undefined)
      }
    }
    if (!intervalID && nCardsShown !== totalCards) {
      setIntervalID(setInterval(() => {
        if (nCardsShown === totalCards) {
          return clearIntervalID()
        }
        setNCardsShown(nCardsShown + 1)
      }, CARD_DEAL_DELAY_MILLIS))
    }
    return clearIntervalID
  }, [intervalID, nCardsShown, totalCards])

  const otherTeam = getOtherTeam(myGamePlayer.team)
  return (
    <div>
      <div className={`game-container ${game.game_type === '2player' ? 'two-player' : undefined}`}>
        {game.game_over ? <GameOverView winning_team={game.winning_team} /> : undefined}
        <ol className={`board ${game.game_over ? 'game-over' : ''}`}>
          {game.board.map((cell, i) => {
            const key = getCellKey(cell)
            const cellSpec = cellSpecs && cellSpecs[key]

            let fullCellCoverType: CellType | undefined = undefined
            if (cell.covered === 'assassin') {
              fullCellCoverType = 'assassin'
            } else if (cell.covered === '1' || cell.covered === '2') {
              fullCellCoverType = 'agent'
            } else if (cell.covered === 'citizen' && cell.covered_citizen_team === 'full') {
              fullCellCoverType = 'citizen'
            }

            const isMyCitizenCover = !fullCellCoverType && cell.covered === 'citizen' && cell.covered_citizen_team === myGamePlayer.team
            const isOtherCitizenCover = !fullCellCoverType && cell.covered === 'citizen' && cell.covered_citizen_team === otherTeam

            const clickable = !gameInvalidated && isGuessing && (!cell.covered || isOtherCitizenCover)
            const shown = nCardsShown > i
            return (
              <WordCard
                key={key}
                className={shown ? 'post-deal-in' : 'pre-deal-in'}
                word={cell.word}
                clickable={clickable}
                codemasterCellType={cellSpec?.cell_type}
                onClick={ev => onCellClick(ev, cell)}
              >
                {fullCellCoverType ? <CardCover type={fullCellCoverType} /> : undefined}
                {isMyCitizenCover ? <span className={`cover-citizen-mine`}><CitizenLabel /></span> : undefined}
                {isOtherCitizenCover ? <span className={`cover-citizen-other`}><CitizenLabel /></span> : undefined}
              </WordCard>
            )
          })}
        </ol>
        {game.game_type === '2player' ? <TurnsView turnNum={currentTurn.turn_num} /> : undefined}
      </div>
      {isMyTurn && currentTurn.hint_word ? <p>Waiting for other player to guess...</p> : undefined}

      <hr />

      {!game.game_over ?
        isCodeMaster && isMyTurn && !currentTurn.hint_word ?
          <CodeMasterHintInputView /> :
          <SpectatorView currentTurn={currentTurn} />
        : undefined
      }

      {isGuessing ? <PrimaryButton fullWidth onClick={onPass} disabled={gameInvalidated || isLastTurn}>Pass</PrimaryButton> : undefined}

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

          .cover-citizen-other {
            position: absolute;
            top: 5px;
            right: 5px;
          }
          .cover-citizen-mine {
            position: absolute;
            bottom: 5px;
            right: 5px;
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
