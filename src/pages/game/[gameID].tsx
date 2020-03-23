import fetch from 'isomorphic-unfetch';
import { NextPage, NextPageContext } from "next";
import { useRouter } from 'next/router';
import { useEffect, useState } from "react";
import socketIO from 'socket.io-client';
import { GamePlay } from "../../components/GamePlay";
import { GameSetup } from "../../components/GameSetup";
import { Layout } from "../../components/Layout";
import { GetGameResult, GetMeResult } from "../../types/api";
import { GameChangeV2Notification, Game, Player } from "../../types/model";
import { createDataFetcher, DataFetcher, useDataFetcher } from "../../util/dataFetcher";
import { ensureResponseOk } from '../../util/util';
import { InvalidSessionError } from '../../util/errors';

interface GameSetupPageProps {
  myPlayer: Player
  initialGame: Game
}

const GameSetupPage: NextPage<GameSetupPageProps> = ({ myPlayer, initialGame }) => {
  const [game, setGame] = useState(initialGame)

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
        <GamePlay game={game} myPlayer={myPlayer} /> :
        <GameSetup game={game} myPlayer={myPlayer} />
      }
    </Layout>
  )
}

GameSetupPage.getInitialProps = async (ctx: NextPageContext) => {
  const opts: RequestInit = { credentials: 'same-origin' }
  if (typeof window === 'undefined') {
    opts.headers = { cookie: ctx.req?.headers.cookie! }
  }

  try {
    const meRes = await ensureResponseOk(await fetch(`${process.env.API_BASE_URL}/api/me`, opts))
    const gameRes = await ensureResponseOk(await fetch(`${process.env.API_BASE_URL}/api/game/${ctx.query.gameID}`))

    const meResult: GetMeResult = await meRes.json()
    const gameResult: GetGameResult = await gameRes.json()

    const ret: GameSetupPageProps = { myPlayer: meResult.player, initialGame: gameResult.game }
    return ret
  } catch (e) {
    if (e instanceof InvalidSessionError) {
      if (typeof window === 'undefined') {
        ctx.res!.writeHead(302, { Location: `/api/auth/login?redirect=${encodeURI(`${process.env.BASE_URL}${ctx.req!.url!}`)}` })
      } else {
        window.location.href = `/api/auth/login?redirect=${encodeURI(window.location.href)}`
      }
    }
    throw e
  }
}

export default GameSetupPage
