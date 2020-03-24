import { FunctionComponent } from "react";
import { useThemeContext } from "../components/ThemeContext";

export interface CardLabelProps {
  className?: string
  position: 'top-right' | 'top-left'
  backgroundColor: string
}

export const CardLabel: FunctionComponent<CardLabelProps> = ({ children, className, position, backgroundColor }) => (
  <span className={`card-label ${position} ${className || ''}`}>
    {children}
    <style jsx>
      {`
        .card-label {
          position: absolute;
          display: block;
          width: 30px;
          height: 30px;
          top: 5px;
          border: 1px solid black;
          border-radius: 5px;
          color: white;
          font-size: 50%;
          background-color: ${backgroundColor};
          overflow: hidden;
          text-align: center;
        }
        .card-label.top-right {
          right: 5px;
        }
        .card-label.top-left {
          left: 5px;
        }
      `}
    </style>
  </span>
)

export const AgentCardLabel: FunctionComponent<Omit<CardLabelProps, 'backgroundColor' | 'position'>> = (props) => {
  const theme = useThemeContext()
  return (
    <CardLabel {...props} backgroundColor={theme.agent.dark} position='top-right'>
      Agent
    </CardLabel>
  )
}

export const AssassinCardLabel: FunctionComponent<Omit<CardLabelProps, 'backgroundColor' | 'position'>> = (props) => {
  const theme = useThemeContext()
  return (
    <CardLabel {...props} backgroundColor={theme.assassin.dark} position='top-right'>
      Assassin
    </CardLabel>
  )
}
