import { FunctionComponent, ChangeEvent } from "react";

export interface SelectProps {
  id?: string
  name?: string
  className?: string
  value?: string
  disabled?: boolean
  onChange?: (ev: ChangeEvent<HTMLSelectElement>) => void
}

export const Select: FunctionComponent<SelectProps> = ({ children, ...props }) => (
  <select {...props}>
    {children}
    <style>
      {`
        select {
          display: block;
          font-size: 110%;
          border: 1px solid gray;
          border-radius: 5px;
          padding: 10px;
          margin-top: 10px;
          outline: none;
        }
      `}
    </style>
  </select>
)
