import { createContext, FunctionComponent, useContext } from "react";
import { Player } from "../types/model";

export interface PlayerContextProps {
  player?: Player
}
const PlayerContext = createContext<PlayerContextProps>({})

export interface PlayerContextProviderProps {
  player?: Player
}
export const PlayerContextProvider: FunctionComponent<PlayerContextProviderProps> = ({ children, player }) => (
  <PlayerContext.Provider value={{ player }}>
    {children}
  </PlayerContext.Provider >
)

export const usePlayerContext = () => {
  return useContext(PlayerContext)
}
