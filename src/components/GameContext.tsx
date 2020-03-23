import { createContext, FunctionComponent, useContext, useState } from "react";
import { Game } from "../types/model";

export interface GameContextProps {
  game: Game
  gameInvalidated: boolean
  invalidateGame: () => void
  validateGame: () => void
  setGame: (game: Game) => void
}

const GameContext = createContext<GameContextProps>({
  game: undefined as any as Game,
  gameInvalidated: false,
  invalidateGame: () => { },
  validateGame: () => { },
  setGame: (_game: Game) => { },
})

export interface GameContextProviderProps {
  initialGame: Game
}
export const GameContextProvider: FunctionComponent<GameContextProviderProps> = ({ initialGame, children }) => {
  const [state, setState] = useState({ game: initialGame, gameInvalidated: false })

  const invalidateGame = () => {
    setState({ ...state, gameInvalidated: true })
  }
  const validateGame = () => {
    setState({ ...state, gameInvalidated: false })
  }
  const setGame = (game: Game) => {
    setState({ game, gameInvalidated: false })
  }

  return <GameContext.Provider value={{ ...state, invalidateGame, validateGame, setGame }}>{children}</GameContext.Provider>
}

export const useGameContext = (): GameContextProps => {
  return useContext(GameContext)
}
