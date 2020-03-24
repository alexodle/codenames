import { FunctionComponent } from "react";

export interface LabelProps {
  className?: string
  htmlFor?: string
}

export const Label: FunctionComponent<LabelProps> = ({ children, ...props }) => (
  <label {...props}>
    {children}
  </label>
)
