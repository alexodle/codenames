import { FunctionComponent } from "react";

export interface LabelProps {
  className?: string
  htmlFor?: string
}

export const Label: FunctionComponent<LabelProps> = ({ children, ...props }) => (
  <label {...props}>
    {children}
    <style jsx>
      {`
        label {
          display: block;
          margin-bottom: 20px;
          margin-top: 20px;
          font-weight: bold;
          font-size: 120%;
        }
      `}
    </style>
  </label>
)
