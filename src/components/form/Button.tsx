import { FunctionComponent } from "react";
import { useThemeContext } from "../ThemeContext";

export interface ButtonProps {
  type?: 'primary' | 'secondary'
  disabled?: boolean
  fullWidth?: boolean
  small?: boolean
  onClick?(ev: React.MouseEvent): void
}

export const Button: FunctionComponent<ButtonProps> = ({ children, type = 'secondary', fullWidth, small, ...props }) => {
  const theme = useThemeContext()
  return (
    <>
      <button className={`${small ? 'small' : ''} ${fullWidth ? 'full-width' : ''} ${type}`} {...props}>
        {children}
      </button>
      <style jsx>
        {`
          button {
            border-radius: 5px;
            padding: 10px;
            margin-top: 10px;
            outline: none;
            font-size: 120%;
          }
          button.full-width {
            width: 100%;
          }
          button.small {
            font-size: 80%;
            padding: 2px;
            margin-top: 2px;
            border-radius: 2px;
          }
          button:enabled {
            cursor: pointer;
          }
          button:disabled {
            background-color: #eeeeee;
            color: #bdbdbd;
            border-color: #bdbdbd;
          }
        `}
      </style>
      <style jsx>
        {`
          button.primary {
            border: 1px solid ${theme.palette.primary.main};
            color: ${theme.palette.primary.contrastText};
            background-color: ${theme.palette.primary.main};
          }
          button.secondary {
            border: 1px solid ${theme.palette.secondary.main};
            color: ${theme.palette.secondary.contrastText};
            background-color: ${theme.palette.secondary.main};
          }
          button.primary:enabled:hover {
            background-color: ${theme.palette.primary.dark};
          }
          button.secondary:enabled:hover {
            background-color: ${theme.palette.secondary.dark};
          }
        `}
      </style>
    </>
  )
}

export const PrimaryButton: FunctionComponent<Omit<ButtonProps, 'type'>> = (props) => (
  <Button {...props} type={'primary'} />
)
