import fetch from 'isomorphic-unfetch';
import { NextPage, NextPageContext } from "next";
import { FunctionComponent } from "react";
import { GameContextProvider, useGameContext } from "../../components/GameContext";
import { GamePlay } from "../../components/GamePlay";
import { GameSetup } from "../../components/GameSetup";
import { Layout } from "../../components/Layout";
import { GetGameResult } from "../../types/api";
import { Game, Player } from "../../types/model";
import { getInitialPropsRequireAuth } from "../../util/gipAuth";
import { ensureResponseOk } from '../../util/util';

interface GameSetupPageWithCtxProps {
  myPlayer: Player
}
const GameSetupPageWithCtx: FunctionComponent<GameSetupPageWithCtxProps> = ({ myPlayer }) => {
  const { game } = useGameContext()
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
