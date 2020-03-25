import { createContext, FunctionComponent, useContext, useState, useEffect, useReducer } from "react";
import { Game, GameChangeV2Notification } from "../types/model";
import socketIO from 'socket.io-client';
import { DataFetcher, createDataFetcher, useDataFetcher } from "../util/dataFetcher";
import { GetGameResult } from "../types/api";

export interface GameContextProps {
  game: Game
  gameInvalidated: boolean
  invalidateGame: () => void
  validateGame: () => void
}

const GameContext = createContext<GameContextProps>({
  game: undefined as any as Game,
  gameInvalidated: false,
  invalidateGame: () => { },
  validateGame: () => { },
})

export interface GameContextProviderProps {
  initialGame: Game
}
export const GameContextProvider: FunctionComponent<GameContextProviderProps> = ({ initialGame, children }) => {
  const gameID = initialGame.id
  const [state, setState] = useState({ game: initialGame, gameInvalidated: false })

  const invalidateGame = () => {
    setState(prevState => ({ ...prevState, gameInvalidated: true }))
  }
  const validateGame = () => {
    setState(prevState => ({ ...prevState, gameInvalidated: false }))
  }

  const [gameFetchState, setFetcher] = useDataFetcher<GetGameResult>(undefined, true)
  useEffect(() => {
    if (gameFetchState.data) {
      setState({ game: gameFetchState.data.game, gameInvalidated: false })
    }
  }, [gameFetchState.data])

  useEffect(() => {
    let cancelled = false

    const io = socketIO(`${process.env.SOCKET_BASE_URL}/game`, { path: '/socket' })

    io.on(`gameChange:${gameID}`, () => {
      if (!cancelled) {
        invalidateGame()
        setFetcher(createDataFetcher<GetGameResult>(`${process.env.API_BASE_URL}/api/game/${gameID}`))
      }
    })

    // TODO
    if (process.env.NODE_ENV !== 'production') {
      io.on(`gameChange_v2:${gameID}`, (not: GameChangeV2Notification) => {
        if (!cancelled) {
          console.log(not)
        }
      })
    }

    return () => {
      try {
        cancelled = true
        io.removeAllListeners()
        io.close()
      } catch { }
    }
  }, [])

  return <GameContext.Provider value={{ ...state, invalidateGame, validateGame }}>{children}</GameContext.Provider>
}

export const useGameContext = (): GameContextProps => {
  return useContext(GameContext)
}
