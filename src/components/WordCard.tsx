import { FunctionComponent, MouseEvent, useState, useEffect } from "react";
import { CellType } from "../types/model";
import { useThemeContext } from "./ThemeContext";
import { capitalize } from "../util/util";

export interface WordCardProps {
  className?: string
  word: string

  codemasterCellType?: CellType

  clickable?: boolean
  onClick: (ev: MouseEvent) => void
}

export const WordCard: FunctionComponent<WordCardProps> = ({ children, className, word, codemasterCellType, clickable, onClick }) => {
  const theme = useThemeContext()
  const lowerColor = codemasterCellType && codemasterCellType !== 'citizen' ? theme[codemasterCellType].dark : theme.unknownColor
  return (
    <li
      className={`board-cell ${clickable ? 'clickable' : ''} ${className || ''}`}
      onClick={clickable ? onClick : undefined}
    >
      <span className='cell-word'>{word}</span>
      {codemasterCellType === 'agent' ? (
        <span className='codemaster-cell-type agent' title='Agent'>
          <img src={`${process.env.BASE_URL}/agent.png`} height='40px' width='40px' alt='agent' />
        </span>
      ) : undefined}
      {codemasterCellType === 'assassin' ? (
        <span className='codemaster-cell-type assassin' title='Assassin'>
          <img src={`${process.env.BASE_URL}/assassin.webp`} height='30px' width='30px' alt='assassin' />
        </span>
      ) : undefined}
      {children}
      <style jsx>
        {`
          .board-cell {
            background: linear-gradient(180deg, ${theme.unknownColor} 50%, ${lowerColor} 50%);
            border: 1px solid gray;
            border-radius: 10px;
            text-align: center;
            height: 100px;
            position: relative;
          }
        `}
      </style>
      <style jsx>
        {`
        .cell-word {
          position: absolute;
          display: block;
          background-color: white;
          width: 100%;
          padding-top: 2px;
          padding-bottom: 2px;
          border-top: 0.5px solid gray;
          border-bottom: 0.5px solid gray;
          top: 36px;
        }

        .codemaster-cell-type {
          position: absolute;
          display: block;
          width: 100%;
          color: white;
        }
        .codemaster-cell-type.agent {
          top: 59px;
        }
        .codemaster-cell-type.assassin {
          top: 65px;
        }
      `}
      </style>
    </li>
  )
}
