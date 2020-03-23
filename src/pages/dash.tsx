import { NextPage, NextPageContext } from "next";
import Link from 'next/link';
import { useRouter } from "next/router";
import { SyntheticEvent, useEffect } from "react";
import { Layout } from "../components/Layout";
import { GetMyGamesResult, PostGameResult } from "../types/api";
import { GameInfo, Player } from "../types/model";
import { createDataSender, useDataFetcher } from "../util/dataFetcher";
import { getInitialPropsRequireAuth } from "../util/gipAuth";
import { ensureResponseOk } from "../util/util";
import { PrimaryButton } from "../components/Button";

interface DashPageProps {
  myPlayer: Player
  myGames: GameInfo[]
}

const DashPage: NextPage<DashPageProps> = ({ myPlayer, myGames }) => {
  const router = useRouter()

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
      <h1>Dashboard</h1>
      <p>Hello, <b>{myPlayer.name}</b></p>
      <PrimaryButton onClick={newGame} disabled={createGameState.isLoading || !!createGameState.data}>Create new game</PrimaryButton>
      <h2>Your games:</h2>
      <ol className='games-list'>
        {myGames.map(g => (
          <li key={g.id} className={g.is_started ? 'started' : ''}>
            <Link href={`/game/${g.id}`}><a>
              <span className='game-info game-date'>{new Date(g.created_on).toDateString()}</span>
              <span className='game-info game-state'>{g.is_started ? 'In progress' : 'Not started'}</span>
              <span className='game-info game-nplayers'>{g.n_players} players</span>
            </a></Link>
          </li>
        ))}
      </ol>
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

DashPage.getInitialProps = getInitialPropsRequireAuth(async (ctx: NextPageContext, player: Player, fetchOpts: RequestInit): Promise<DashPageProps> => {
  const myGamesRes = await ensureResponseOk(await fetch(`${process.env.API_BASE_URL}/api/game/mine`, fetchOpts))
  const myGames: GetMyGamesResult = await myGamesRes.json()
  return { myPlayer: player, myGames: myGames.games }
})

export default DashPage
