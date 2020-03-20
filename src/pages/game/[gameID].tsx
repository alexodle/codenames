import { NextPage } from "next";
import { useRouter } from 'next/router';
import { FunctionComponent, useEffect } from "react";
import { Layout } from "../../components/layout";
import { GetGameInfoResult } from "../../types/api";
import { GameInfo, GamePlayer, PlayerType, Team } from "../../types/model";
import { PutPlayerRequest } from "../../types/api"
import { createDataFetcher, createDataSender, useDataFetcher, useDataFetchers, DataFetcher } from "../../util/dataFetcher";

const useRouterState = (): [number, string, boolean] => {
  const router = useRouter()
  const gameID = parseInt(router.query.gameID as string, 10)
  if (isNaN(gameID)) return [-1, '', false]

  const myURL = `${process.env.BASE_URL}/game/${gameID}`
  return [gameID, myURL, true]
}

interface ChoiceButtonProps {
  game: GameInfo
  team: Team
  playerType: PlayerType
  player?: GamePlayer
}
const ChoiceButton: FunctionComponent<ChoiceButtonProps> = ({ game, team, playerType, player }) => {
  const [gameID, myURL] = useRouterState()
  const [updateState, setFetchers] = useDataFetchers(myURL, [], false)

  const onClick = async () => {
    if (updateState.isLoading) return
    setFetchers([createDataSender<{}, PutPlayerRequest>(`${process.env.API_BASE_URL}/api/game/${gameID}/player`, 'PUT', {
      playerType,
      team,
    })])
  }

  return (
    <div className='player-container' onClick={onClick}>
      <span className='player-type'>
        {playerType === 'codemaster' ? 'CODEMASTER' : 'GUESSER'}
      </span>
      {!player && !updateState.isLoading ? undefined : (
        <span className='player'>
          {updateState.isLoading ? '...' : player!.player!.name}
        </span>
      )}
      <style jsx>{`
        .player-container {
          cursor: pointer;
          border: 1px solid gray;
          height: 80px;
          width: 140px;
        }
        .player-type {
          display: block;
        }
        .player {
          display: block;
        }
      `}</style>
    </div>
  )
}

interface GameSetupProps {
  game: GameInfo
}
const GameSetup: FunctionComponent<GameSetupProps> = ({ game }) => {
  const playersByPosition: { [key: string]: GamePlayer | undefined } = {}
  game.players.forEach(gp => {
    playersByPosition[`${gp.team}:${gp.player_type}`] = gp
  })

  return (
    <div className='game-setup-container'>
      <div className='team'>
        <h2>Blue Team</h2>
        <ChoiceButton game={game} team='1' playerType='codemaster' player={playersByPosition['1:codemaster']} />
        <ChoiceButton game={game} team='1' playerType='guesser' player={playersByPosition['1:guesser']} />
      </div>
      <div className='team'>
        <h2>Red Team</h2>
        <ChoiceButton game={game} team='2' playerType='codemaster' player={playersByPosition['2:codemaster']} />
        <ChoiceButton game={game} team='2' playerType='guesser' player={playersByPosition['2:guesser']} />
      </div>
      <style jsx>{`
      `}</style>
    </div>
  )
}

const GameSetupPage: NextPage = () => {
  const [gameID, myURL, isReady] = useRouterState()

  const [gameState, setFetcher] = useDataFetcher<GetGameInfoResult>(myURL, undefined, true)
  useEffect(() => {
    if (gameID !== -1) {
      setFetcher(createDataFetcher<GetGameInfoResult>(`${process.env.API_BASE_URL}/api/game/${gameID}`))
    }
  }, [gameID])

  const renderBody = () => {
    if (gameState.error) {
      return <p>ERROR: {gameState.error.message}</p>
    } else if (gameState.isLoading || !isReady) {
      return <p>Loading...</p>
    }
    return <GameSetup game={gameState.data.game} />
  }

  return (
    <Layout>
      <h1>Game setup</h1>
      {renderBody()}
    </Layout>
  )
}

export default GameSetupPage
