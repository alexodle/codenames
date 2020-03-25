import fetch from 'isomorphic-unfetch';
import { NextPage, NextPageContext } from "next";
import Link from 'next/link';
import { useRouter } from "next/router";
import { FunctionComponent, SyntheticEvent, useEffect } from "react";
import { PrimaryButton } from "../components/form/Button";
import { Layout } from "../components/Layout";
import { PlayerContextProvider, usePlayerContext } from "../components/PlayerContext";
import { GetMeResult, GetMyGamesResult, PostGameResult } from "../types/api";
import { Player, GameInfo } from "../types/model";
import { createDataFetcher, createDataSender, useDataFetcher } from "../util/dataFetcher";
import { InvalidSessionError } from "../util/errors";
import { getFetchOpts } from "../util/gipAuth";
import { ensureResponseOk, sort } from "../util/util";
import { useThemeContext } from '../components/ThemeContext';

const formatDate = (d: Date | string): string => {
  d = new Date(d)
  return d.toLocaleDateString()
}

interface GamesListProps {
  games: GameInfo[]
}
const GamesList: FunctionComponent<GamesListProps> = ({ games }) => {
  const theme = useThemeContext()
  return (
    <ol className='games-list'>
      {!games.length ? <p>None</p> : undefined}
      {games.map(g => {
        if (!g.players) {
          debugger
        }
        return (
          <li key={g.id}>
            <Link href={`/game/${g.id}`}><a>
              <span className='game-info'>Game {g.id}</span>
              <span className='game-info game-date'>{formatDate(g.created_on)}</span>
              <span className='game-info game-nplayers'>{g.players.length} players</span>
              <span>{sort(g.players.map(p => p.player!.name)).join(', ')}</span>
            </a></Link>
          </li>
        )
      })}
      <style jsx>
        {`
          a, a:visited {
            color: inherit;
            text-decoration: none;
          }
          .game-info {
            display: inline-block;
            width: 150px;
          }
          .games-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          li {
            padding: 10px;
          }
        `}
      </style>
      <style jsx>
        {`
          li:nth-child(even) {
            background: ${theme.palette.primary.light};
          }
          li:nth-child(odd) {
            background: ${theme.palette.secondary.light};
          }
          li:nth-child(even):hover {
            background: ${theme.palette.primary.main};
          }
          li:nth-child(odd):hover {
            background: ${theme.palette.secondary.main};
          }
        `}
      </style>
    </ol>
  )
}

const DashPageContents: FunctionComponent = () => {
  const router = useRouter()
  const { player } = usePlayerContext()

  const [myGamesState, setMyGamesFetcher] = useDataFetcher<GetMyGamesResult>(undefined, !!player)
  useEffect(() => {
    if (player) {
      setMyGamesFetcher(createDataFetcher(`${process.env.API_BASE_URL}/api/game/mine`))
    }
  }, [player?.id])

  const [createGameState, setCreateGameFetcher] = useDataFetcher<PostGameResult>(undefined, false)
  useEffect(() => {
    if (createGameState.data && createGameState.data.gameID) {
      router.push(`/game/${createGameState.data.gameID}`)
    }
  }, [createGameState.data])

  const newGame = (ev: SyntheticEvent) => {
    ev.preventDefault()
    if (!player) {
      const createGameRedirect = `${process.env.BASE_URL}/game/new`
      window.location.href = `${process.env.API_BASE_URL}/api/auth/login?redirect=${encodeURIComponent(createGameRedirect)}`
    } else {
      setCreateGameFetcher(createDataSender<PostGameResult, {}>(`${process.env.API_BASE_URL}/api/game`, 'POST', {}))
    }
  }

  return (
    <Layout myPlayer={player}>
      <PrimaryButton fullWidth onClick={newGame} disabled={createGameState.isLoading || !!createGameState.data}>Start a new game</PrimaryButton>

      {myGamesState.isLoading || myGamesState.data ? (
        <>
          <h2>Your games</h2>
          {myGamesState.isLoading ? <p>Loading...</p> : undefined}
          {myGamesState.data ? (
            <>
              <h3>Active</h3>
              <GamesList games={myGamesState.data.activeGames} />
              <h3>Unstarted</h3>
              <GamesList games={myGamesState.data.unstartedGames} />
              <h3>Completed</h3>
              <GamesList games={myGamesState.data.completedGames} />
            </>
          ) : undefined}
        </>
      ) : undefined}

      <h2>Join a public game</h2>
      {/* TODO */}
      <p>Coming soon</p>
    </Layout>
  )
}

interface DashPageProps {
  player?: Player
}

const DashPage: NextPage<DashPageProps> = ({ player }) => (
  <PlayerContextProvider player={player}>
    <DashPageContents />
  </PlayerContextProvider>
)

DashPage.getInitialProps = async (ctx: NextPageContext): Promise<DashPageProps> => {
  try {
    const playerRes = await ensureResponseOk(await fetch(`${process.env.API_BASE_URL}/api/me`, getFetchOpts(ctx)))
    const playerResult: GetMeResult = await playerRes.json()
    return { player: playerResult.player }
  } catch (e) {
    if (!(e instanceof InvalidSessionError)) {
      throw e
    }
  }
  return {}
}

export default DashPage
