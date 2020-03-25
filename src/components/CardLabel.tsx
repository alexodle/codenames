import { FunctionComponent } from "react";
import { useThemeContext } from "../components/ThemeContext";

export interface CardLabelProps {
  backgroundColor: string
}

export const CardLabel: FunctionComponent<CardLabelProps> = ({ children, backgroundColor }) => (
  <span className={`card-label`}>
    {children}
    <style jsx>
      {`
        .card-label {
          display: block;
          width: 28px;
          height: 28px;
          padding-top: 4px;
          border: 1px solid black;
          border-radius: 3px;
          color: white;
          font-size: 50%;
          background-color: ${backgroundColor};
          overflow: hidden;
          text-align: center;
        }
      `}
    </style>
  </span>
)

export const CitizenLabel: FunctionComponent<Omit<CardLabelProps, 'backgroundColor'>> = (props) => {
  const theme = useThemeContext()
  return (
    <CardLabel {...props} backgroundColor={theme.citizen.dark}>
      <img src={`${process.env.BASE_URL}/citizen.png`} alt='citzen' width='20px' height='20px' />
    </CardLabel>
  )
}
