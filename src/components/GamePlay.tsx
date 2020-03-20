import { FunctionComponent } from "react";
import { Game, Player, GamePlayer, SpecCardCell, CellType } from "../types/model";
import { useDataFetcher, createDataFetcher } from "../util/dataFetcher";
import { GetGamePlayerViewRequest } from "../types/api";
import { groupBy, keyBy } from "../util/util";

export interface GamePlayProps {
  game: Game
  myURL: string
  myPlayer: Player
}

const cellKey = (c: { row: number, col: number }): string => `${c.row}:${c.col}`

export const GamePlay: FunctionComponent<GamePlayProps> = ({ game, myURL, myPlayer }) => {
  const myGamePlayer = game.players.find(p => p.player_id === myPlayer.id)!

  const isCodeMaster = myGamePlayer.player_type === 'codemaster'
  const codemasterDataFetcher = isCodeMaster ? createDataFetcher<GetGamePlayerViewRequest>(`${process.env.API_BASE_URL}/api/game/${game.id}/player`) : undefined
  const [codemasterState] = useDataFetcher(myURL, codemasterDataFetcher, isCodeMaster)

  let cellTypes: { [key: string]: SpecCardCell }
  if (codemasterState.data) {
    cellTypes = keyBy(codemasterState.data.teamBoardSpec.specCardCells, cellKey)
  }

  return (
    <div>
      <h1>Codenames</h1>
      <ol className='board'>
        {game.board.map(cell => {
          const key = cellKey(cell)
          const cellType = cellTypes && cellTypes[key]
          return (
            <li
              key={key}
              className={`board-cell ${codemasterState.isLoading ? 'codemaster-loading' : ''}`}
            >
              {cellType && cellType.cell_type !== 'citizen' ? <span className={`cell-type ${cellType.cell_type || ''}`} /> : undefined}
              <span className='cell-word'>{cell.word}</span>
            </li>
          )
        })}
      </ol>
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
            line-height: 100px;
            position: relative;
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
          }
          .cell-type.assassin {
            background-color: black;
          }
          .cell-type.agent {
            background-color: green;
          }
        `}
      </style>
    </div>
  )
}
