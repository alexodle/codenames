import { FunctionComponent, ChangeEvent } from "react";

export interface InputProps {
  error?: boolean
  id?: string
  name?: string
  placeholder?: string
  value?: string
  disabled?: boolean
  fullWidth?: boolean
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
}

export const Input: FunctionComponent<InputProps> = ({ error, fullWidth, ...props }) => (
  <>
    <input {...props} className={error ? 'error' : ''} />
    <style jsx>
      {`
        input {
          display: block;
          font-size: 110%;
          border: 1px solid gray;
          border-radius: 5px;
          padding: 10px;
          margin-top: 10px;
          outline: none;
          ${fullWidth ? 'width: 100%;' : ''}
        }
        input.error {
          border: 1px solid red;
        }
      `}
    </style>
  </>
)
