import { FunctionComponent, MouseEvent } from "react";

export interface WordCardProps {
  word: string
  clickable?: boolean
  animationSeconds: number
  onClick: (ev: MouseEvent) => void
}

export const WordCard: FunctionComponent<WordCardProps> = ({ children, word, clickable, animationSeconds, onClick }) => (
  <li
    className={`board-cell ${clickable ? 'clickable' : ''}`}
    onClick={clickable ? onClick : undefined}
  >
    <span className='cell-word'>{word}</span>
    {children}
    {/* <style jsx>
      {`
        .board-cell {
          animation: bounceIn ${animationSeconds}s;
        }
      `}
    </style> */}
    <style jsx>
      {`
        .board-cell {
          border: 1px solid gray;
          border-radius: 10px;
          text-align: center;
          height: 100px;
          position: relative;
          overflow: hidden;

          background: linear-gradient(180deg, #FFFACD 50%, #D3D3D3 50%);

          animation: bounceIn ${animationSeconds}s;
        }
        .cell-word {
          positon: absolute;
          display: block;
          background-color: white;
          transform: translateY(40px);
        }

        @keyframes bounceIn {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          100% {
            transform: scale(1);
          }
        }
      `}
    </style>
  </li>
)
