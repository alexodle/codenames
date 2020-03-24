import { FunctionComponent, ChangeEvent } from "react";

export interface InputProps {
  error?: boolean
  id?: string
  name?: string
  placeholder?: string
  className?: string
  value?: string
  disabled?: boolean
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
}

export const Input: FunctionComponent<InputProps> = ({ className, error, ...props }) => (
  <>
    <input {...props} className={`${className || ''} ${error ? 'error' : ''}`} />
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
        }
        input.error {
          border: 1px solid red;
        }
      `}
    </style>
  </>
)
