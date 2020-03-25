import { createContext, useContext, FunctionComponent } from "react";

const defaultTheme = {
  unknownColor: '#FFFACD',
  teams: {
    '1': {
      light: '#bbdefb',
      dark: '#1976d2',
    },
    '2': {
      light: '#fff9c4',
      dark: '#ffeb3b',
    }
  },
  agent: {
    light: '#4caf50',
    dark: '#4caf50',
  },
  assassin: {
    light: '#f44336',
    dark: '#f44336',
  },
  citizen: {
    light: '#D3D3D3',
    dark: '#D3D3D3',
  },
  palette: {
    primary: {
      light: '#cfd8dc',
      main: '#607d8b',
      dark: '#37474f',
      contrastText: '#fff',
    },
    secondary: {
      light: '#dcedc8',
      main: '#8bc34a',
      dark: '#33691e',
      contrastText: '#fff',
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
