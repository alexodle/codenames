import { NextPage } from "next";
import { SyntheticEvent, useEffect } from "react";
import { Layout } from "../components/Layout";
import { GetMeResult, GetMyGamesResult, PostGameResult } from "../types/api";
import { createDataFetcher, createDataSender, useDataFetcher, useDataFetchers } from "../util/dataFetcher";
import { useRouter } from "next/router";

interface DashPageProps { }

const DashPage: NextPage<DashPageProps> = () => {
  const router = useRouter()

  const [dataState] = useDataFetchers([
    createDataFetcher<GetMeResult>(`${process.env.API_BASE_URL}/api/me`),
    createDataFetcher<GetMyGamesResult>(`${process.env.API_BASE_URL}/api/game/mine`),
  ])

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

  const renderBody = () => {
    if (dataState.isLoading) return <p>Loading...</p>
    if (dataState.error) return <p>ERROR: {dataState.error.message}</p>

    return (
      <>
        <p>Hello, friend: <code>{JSON.stringify(dataState.data)}</code></p>
        <button onClick={newGame} disabled={createGameState.isLoading}>Create new game</button>
      </>
    )
  }

  return (
    <Layout>
      <h1>Dashboard</h1>
      {renderBody()}
    </Layout>
  )
}

export default DashPage
