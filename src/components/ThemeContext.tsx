import { createContext, useContext, FunctionComponent } from "react";


const defaultTheme = {
  palette: {
    primary: {
      light: '#757ce8',
      main: '#3f50b5',
      dark: '#002884',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ff7961',
      main: '#f44336',
      dark: '#ba000d',
      contrastText: '#000',
    },
  },
}

const ThemeContext = createContext(defaultTheme)

export const ThemeContextProvider: FunctionComponent = ({ children }) => (
  <ThemeContext.Provider value={defaultTheme}>
    {children}
  </ThemeContext.Provider >
)

export const useThemeContext = () => {
  return useContext(ThemeContext)
}
