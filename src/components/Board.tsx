import { FunctionComponent, useState } from "react";
import { CellType, GameBoardCell, GamePlayer, SpecCardCell } from "../types/model";
import { COLS, ROWS } from "../util/constants";
import { getCellKey, getOtherTeam, keyBy } from "../util/util";
import { CardCover } from "./CardCover";
import { CitizenLabel } from "./CardLabel";
import { useGameContext } from "./GameContext";
import { useInterval } from "./useInterval";
import { WordCard } from "./WordCard";

const CARD_DEAL_DELAY_MILLIS = 10
const TOTAL_CARDS = ROWS * COLS

const useCardIntervalCounter = () => {
  const [nCards, setNCards] = useState(-1)
  useInterval(() => {
    setNCards(nCards + 1)
  }, nCards < TOTAL_CARDS ? CARD_DEAL_DELAY_MILLIS : undefined)
  return nCards
}

export interface BoardProps {
  myGamePlayer: GamePlayer
  isGuessing: boolean

  // Only provided for codemasters
  specCardCells?: SpecCardCell[]

  onCellClick?: (cell: GameBoardCell) => void
}

export const Board: FunctionComponent<BoardProps> = ({ myGamePlayer, isGuessing, specCardCells, onCellClick }) => {
  const { game, gameInvalidated } = useGameContext()

  const cellSpecs = specCardCells && keyBy(specCardCells, getCellKey)

  const otherTeam = getOtherTeam(myGamePlayer.team)

  const animateCardIdx = useCardIntervalCounter()
  return (
    <div className={`board ${game.game_over ? 'game-over' : ''}`}>
      <ol className='board-cells'>
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
          const shown = animateCardIdx >= i
          return (
            <WordCard
              key={key}
              className={shown ? 'post-deal-in' : 'pre-deal-in'}
              word={cell.word}
              clickable={clickable}
              codemasterCellType={cellSpec?.cell_type}
              onClick={() => onCellClick && onCellClick(cell)}
            >
              {fullCellCoverType ? <CardCover type={fullCellCoverType} /> : undefined}
              {isMyCitizenCover ? <span className={`cover-citizen-mine`}><CitizenLabel /></span> : undefined}
              {isOtherCitizenCover ? <span className={`cover-citizen-other`}><CitizenLabel /></span> : undefined}
            </WordCard>
          )
        })}
      </ol>
      {game.game_over ? <span className='game-over-cover' /> : undefined}
      <style jsx>
        {`
          .board {
            position: relative;
            border: 1px solid gray;
            border-radius: 10px;
          }

          .board ol {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
            column-gap: 10px;
            row-gap: 10px;
            margin: 0;
            padding: 0;
            padding: 10px;
            list-style-type: none;
          }

          .game-over-cover {
            position: absolute;
            display: block;
            width: 100%;
            height: 100%;
            z-index: 5000;
            background-color: #E8E8E8;
            opacity: 50%;
            border-radius: 10px;
            top: 0;
            left: 0;
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
        `}
      </style>
    </div>
  )
}
