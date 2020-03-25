import { FunctionComponent, ChangeEvent } from "react";

export interface SelectProps {
  id?: string
  name?: string
  value?: string
  disabled?: boolean
  fullWidth?: boolean
  onChange?: (ev: ChangeEvent<HTMLSelectElement>) => void
}

export const Select: FunctionComponent<SelectProps> = ({ children, fullWidth, ...props }) => (
  <select {...props}>
    {children}
    <style jsx>
      {`
        select {
          display: block;
          font-size: 110%;
          border: 1px solid gray;
          border-radius: 5px;
          margin-top: 10px;
          outline: none;
          ${fullWidth ? 'width: 100%;' : ''}
        }
      `}
    </style>
  </select>
)
