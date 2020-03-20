import { NextPage } from "next";
import { SyntheticEvent, useState, useEffect } from "react";
import { Layout } from "../components/layout";
import { GetMeResult, GetMyGamesResult, PostGameResult } from "../types/api";
import { createDataFetcher, useDataFetcher, useDataFetchers, DataFetcher, createDataSender } from "../util/dataFetcher";

const MY_URL = `${process.env.BASE_URL}/dash`

interface DashPageProps { }

const DashPage: NextPage<DashPageProps> = () => {
  const [dataState] = useDataFetchers(MY_URL, [
    createDataFetcher<GetMeResult>(`${process.env.API_BASE_URL}/api/me`),
    createDataFetcher<GetMyGamesResult>(`${process.env.API_BASE_URL}/api/game/mine`),
  ])

  const [createGameState, setCreateGameFetcher] = useDataFetcher<PostGameResult>(MY_URL, undefined, false)
  useEffect(() => {
    if (createGameState.data && createGameState.data.gameID) {
      window.location.href = `/game/${createGameState.data.gameID}`
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
