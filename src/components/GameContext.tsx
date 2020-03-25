import { createContext, FunctionComponent, useContext, useState, useEffect } from "react";
import { Game, GameChangeV2Notification } from "../types/model";
import socketIO from 'socket.io-client';
import { DataFetcher, createDataFetcher, useDataFetcher } from "../util/dataFetcher";
import { GetGameResult } from "../types/api";

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

  const [gameFetchState, setFetcher] = useDataFetcher<GetGameResult>(undefined, true)
  useEffect(() => {
    if (gameFetchState.data) {
      setGame(gameFetchState.data.game)
    }
  }, [gameFetchState.data])

  const invalidateGame = () => {
    setState({ ...state, gameInvalidated: true })
  }
  const validateGame = () => {
    setState({ ...state, gameInvalidated: false })
  }
  const setGame = (game: Game) => {
    setState({ game, gameInvalidated: false })
  }

  const createGameFetcher = (): DataFetcher<GetGameResult> =>
    createDataFetcher<GetGameResult>(`${process.env.API_BASE_URL}/api/game/${state.game.id}`)

  useEffect(() => {
    console.log('using effect')
    const io = socketIO(`${process.env.SOCKET_BASE_URL}/game`, { path: '/socket' })

    io.on(`gameChange:${state.game.id}`, () => {
      invalidateGame()
      setFetcher(createGameFetcher())
    })

    // TODO
    if (process.env.NODE_ENV !== 'production') {
      io.on(`gameChange_v2:${state.game.id}`, (not: GameChangeV2Notification) => {
        console.log(not)
      })
    }

    return () => {
      try {
        io.removeAllListeners()
        io.close()
      } catch { }
    }
  }, [])

  return <GameContext.Provider value={{ ...state, invalidateGame, validateGame, setGame }}>{children}</GameContext.Provider>
}

export const useGameContext = (): GameContextProps => {
  return useContext(GameContext)
}
