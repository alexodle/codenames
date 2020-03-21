import { NextPage } from "next";
import { useRouter } from 'next/router';
import { useEffect } from "react";
import socketIO from 'socket.io-client';
import { GameSetup } from "../../components/GameSetup";
import { Layout } from "../../components/Layout";
import { GetGameResult, GetMeResult } from "../../types/api";
import { createDataFetcher, DataFetcher, useDataFetcher } from "../../util/dataFetcher";
import { GamePlay } from "../../components/GamePlay"

const useRouterState = (): [number, string] | [-1, ''] => {
  const router = useRouter()
  const gameID = parseInt(router.query.gameID as string, 10)
  if (isNaN(gameID)) return [-1, '']

  const myURL = `${process.env.BASE_URL}/game/${gameID}`
  return [gameID, myURL]
}

const GameSetupPage: NextPage = () => {
  const [gameID, myURL] = useRouterState()

  const [myPlayerState, setMyPlayerStateFetcher] = useDataFetcher<GetMeResult>(myURL, undefined, true)

  const createGameFetcher = (): DataFetcher<GetGameResult> =>
    createDataFetcher<GetGameResult>(`${process.env.API_BASE_URL}/api/game/${gameID}`)

  const [gameState, setFetcher] = useDataFetcher<GetGameResult>(myURL, undefined, true)
  useEffect(() => {
    if (gameID !== -1) {
      setMyPlayerStateFetcher(createDataFetcher<GetMeResult>(`${process.env.API_BASE_URL}/api/me`))
      setFetcher(createGameFetcher())
    }
  }, [gameID])

  useEffect(() => {
    if (gameID) {
      const io = socketIO(`${process.env.SOCKET_BASE_URL}/game/${gameID}`, { path: '/socket' })
      io.on('gameChange', () => {
        setFetcher(createGameFetcher())
      })
      return () => {
        try {
          io.close()
        } catch (e) { }
      }
    }
  }, [gameID])

  const isStarted = gameState.data?.game.is_started
  return (
    <Layout>
      {myPlayerState.data ? <p>Player: {myPlayerState.data.player.sub} ({myPlayerState.data.player.id})</p> : undefined}
      {gameState.error ? (
        <p>ERROR: {gameState.error.message}</p>
      ) : undefined}
      {!gameState.data || !myPlayerState.data ? (
        <p>Loading...</p>
      ) : undefined}
      {gameState.data && myPlayerState.data ? (
        isStarted ? <GamePlay game={gameState.data.game} myURL={myURL} myPlayer={myPlayerState.data.player} /> : <GameSetup game={gameState.data.game} myURL={myURL} myPlayer={myPlayerState.data.player} />
      ) : undefined}
    </Layout>
  )
}

export default GameSetupPage
