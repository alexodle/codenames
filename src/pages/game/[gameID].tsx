import fetch from 'isomorphic-unfetch';
import { NextPage, NextPageContext } from "next";
import { useEffect, useState, FunctionComponent } from "react";
import socketIO from 'socket.io-client';
import { GamePlay } from "../../components/GamePlay";
import { GameSetup } from "../../components/GameSetup";
import { Layout } from "../../components/Layout";
import { GetGameResult } from "../../types/api";
import { Game, GameChangeV2Notification, Player } from "../../types/model";
import { createDataFetcher, DataFetcher, useDataFetcher } from "../../util/dataFetcher";
import { getInitialPropsRequireAuth } from "../../util/gipAuth";
import { ensureResponseOk } from '../../util/util';
import { GameContextProvider, useGameContext } from "../../components/GameContext";

interface GameSetupPageWithCtxProps {
  myPlayer: Player
}
const GameSetupPageWithCtx: FunctionComponent<GameSetupPageWithCtxProps> = ({ myPlayer }) => {
  const { game, invalidateGame, setGame } = useGameContext()

  const createGameFetcher = (): DataFetcher<GetGameResult> =>
    createDataFetcher<GetGameResult>(`${process.env.API_BASE_URL}/api/game/${game.id}`)

  const [gameFetchState, setFetcher] = useDataFetcher<GetGameResult>(undefined, true)
  useEffect(() => {
    if (gameFetchState.data) {
      setGame(gameFetchState.data.game)
    }
  }, [gameFetchState.data])

  useEffect(() => {
    const io = socketIO(`${process.env.SOCKET_BASE_URL}/game`, { path: '/socket' })

    io.on(`gameChange:${game.id}`, () => {
      invalidateGame()
      setFetcher(createGameFetcher())
    })

    // TODO
    if (process.env.NODE_ENV !== 'production') {
      io.on(`gameChange_v2:${game.id}`, (not: GameChangeV2Notification) => {
        console.log(not)
      })
    }

    return () => {
      try {
        io.removeAllListeners()
        io.close()
      } catch { }
    }
  })

  return (
    <Layout>
      <h1>Codenames</h1>
      {game.is_started ?
        <GamePlay myPlayer={myPlayer} /> :
        <GameSetup myPlayer={myPlayer} />
      }
    </Layout>
  )
}

interface GameSetupPageProps {
  myPlayer: Player
  initialGame: Game
}
const GameSetupPage: NextPage<GameSetupPageProps> = ({ myPlayer, initialGame }) => (
  <GameContextProvider initialGame={initialGame}>
    <GameSetupPageWithCtx myPlayer={myPlayer} />
  </GameContextProvider>
)

GameSetupPage.getInitialProps = getInitialPropsRequireAuth(async (ctx: NextPageContext, player: Player, fetchOpts: RequestInit): Promise<GameSetupPageProps> => {
  const gameRes = await ensureResponseOk(await fetch(`${process.env.API_BASE_URL}/api/game/${ctx.query.gameID}`, fetchOpts))
  const gameResult: GetGameResult = await gameRes.json()
  const ret: GameSetupPageProps = { myPlayer: player, initialGame: gameResult.game }
  return ret
})

export default GameSetupPage
