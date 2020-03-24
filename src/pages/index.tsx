import { NextPage, NextPageContext } from "next";
import Link from 'next/link';
import { useRouter } from "next/router";
import { SyntheticEvent, useEffect, FunctionComponent } from "react";
import { PrimaryButton } from "../components/Button";
import { Layout } from "../components/Layout";
import { PostGameResult, GetMyGamesResult, GetMeResult } from "../types/api";
import { createDataSender, useDataFetcher, createDataFetcher } from "../util/dataFetcher";
import { usePlayerContext, PlayerContextProvider } from "../components/PlayerContext"
import { Player } from "../types/model";
import { ensureResponseOk } from "../util/util";
import fetch from 'isomorphic-unfetch';
import { InvalidSessionError } from "../util/errors";
import { getFetchOpts } from "../util/gipAuth";

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
    setCreateGameFetcher(createDataSender<PostGameResult, {}>(`${process.env.API_BASE_URL}/api/game`, 'POST', {}))
  }

  return (
    <Layout>
      <h1>Codenames with friends</h1>
      {player ?
        <p>Welcome back, <b>{player.name}</b></p> :
        <p>Welcome, gamer</p>}

      <h2>Start a new game</h2>
      <PrimaryButton onClick={newGame} disabled={createGameState.isLoading || !!createGameState.data}>Create new game</PrimaryButton>
      {myGamesState.isLoading || myGamesState.data ? (
        <>
          <h2>Or, continue an old game:</h2>
          {myGamesState.isLoading ? <p>Loading...</p> : undefined}
          {myGamesState.data ? (
            <ol className='games-list'>
              {myGamesState.data.games.map(g => (
                <li key={g.id} className={g.is_started ? 'started' : ''}>
                  <Link href={`/game/${g.id}`}><a>
                    <span className='game-info game-date'>{new Date(g.created_on).toDateString()}</span>
                    <span className='game-info game-state'>{g.is_started ? 'In progress' : 'Not started'}</span>
                    <span className='game-info game-nplayers'>{g.n_players} players</span>
                  </a></Link>
                </li>
              ))}
            </ol>
          ) : undefined}
        </>
      ) : undefined}
      <style jsx>
        {`
          .games-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .games-list li {
            margin-top: 10px;
          }
          .games-list li.started {
            font-weight: bold;
          }

          .game-info {
            display: inline-block;
            width: 150px;
          }
        `}
      </style>
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
