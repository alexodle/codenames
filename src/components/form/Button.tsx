import { FunctionComponent } from "react";
import { useThemeContext } from "../ThemeContext";

export interface ButtonProps {
  type?: 'primary' | 'secondary'
  disabled?: boolean
  fullWidth?: boolean
  onClick?(ev: React.MouseEvent): void
}

export const Button: FunctionComponent<ButtonProps> = ({ children, type = 'secondary', fullWidth, ...props }) => {
  const theme = useThemeContext()
  return (
    <>
      <button {...props}>
        {children}
      </button>
      <style>
        {`
          button {
            border: 1px solid ${theme.palette[type].main};
            border-radius: 5px;
            padding: 10px;
            margin-top: 10px;
            outline: none;
            font-size: 120%;
            color: ${theme.palette[type].contrastText};
            background-color: ${theme.palette[type].main};
            ${fullWidth ? 'width: 100%;' : ''}
          }
          button:enabled {
            cursor: pointer;
          }
          button:enabled:hover {
            background-color: ${theme.palette[type].dark};
          }
          button:disabled {
            background-color: #eeeeee;
            color: #bdbdbd;
            border-color: #bdbdbd;
          }
        `}
      </style>
    </>
  )
}

export const PrimaryButton: FunctionComponent<Omit<ButtonProps, 'type'>> = (props) => (
  <Button {...props} type={'primary'} />
)
