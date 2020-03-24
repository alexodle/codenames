import { FunctionComponent } from "react";

export interface OptionProps {
  value: string
}

export const Option: FunctionComponent<OptionProps> = ({ children, ...props }) => (
  <option {...props}>
    {children}
  </option>
)
