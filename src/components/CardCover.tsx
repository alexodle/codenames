import { FunctionComponent } from "react";
import { CellType } from "../types/model";
import { useThemeContext } from "./ThemeContext";

export interface CardCoverProps {
  type: CellType
}

export const CardCover: FunctionComponent<CardCoverProps> = ({ type }) => {
  const theme = useThemeContext()
  return (
    <div className='card-cover'>
      {type === 'citizen' ? <img className={type} src={`${process.env.BASE_URL}/citizen.png`} alt={type} width='95px' height='95px' /> : undefined}
      {type === 'agent' ? <img className={type} src={`${process.env.BASE_URL}/agent.png`} alt={type} width='95px' height='95px' /> : undefined}
      {type === 'assassin' ? <img className={type} src={`${process.env.BASE_URL}/assassin.webp`} alt={type} width='95px' height='95px' /> : undefined}
      <style jsx>
        {`
          .card-cover {
            position: absolute;
            z-index: 1000;
            background-color: ${theme[type].light};
            border-radius: 9px;
            width: 100%;
            height: 100%;
          }
          .card-cover img {
            position: absolute;
            top: 0;
          }
          .card-cover img.citizen {
            left: 30px;
          }
          .card-cover img.agent {
            left: 30px;
          }
        `}
      </style>
    </div>
  )
}
