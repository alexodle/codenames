import { FunctionComponent, MouseEvent, useState, useEffect } from "react";

export interface WordCardProps {
  className?: string
  word: string
  clickable?: boolean
  animationDelayMillis: number
  onClick: (ev: MouseEvent) => void
}

export const WordCard: FunctionComponent<WordCardProps> = ({ children, className, word, clickable, onClick }) => (
  <li
    className={`board-cell ${clickable ? 'clickable' : ''} ${className || ''}`}
    onClick={clickable ? onClick : undefined}
  >
    <span className='cell-word'>{word}</span>
    {children}
    <style jsx>
      {`
        .board-cell {
          background: linear-gradient(180deg, #FFFACD 50%, #D3D3D3 50%);
          border: 1px solid gray;
          border-radius: 10px;
          text-align: center;
          height: 100px;
          position: relative;
        }

        .cell-word {
          positon: absolute;
          display: block;
          background-color: white;
          transform: translateY(40px);
        }
      `}
    </style>
  </li>
)
