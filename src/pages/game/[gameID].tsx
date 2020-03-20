import { NextPage } from "next";
import { useRouter } from 'next/router';
import { FunctionComponent, useEffect } from "react";
import socketIO from 'socket.io-client';
import { Layout } from "../../components/layout";
import { GetGameInfoResult, PutPlayerRequest } from "../../types/api";
import { GameInfo, GamePlayer, PlayerType, Team } from "../../types/model";
import { createDataFetcher, createDataSender, DataFetcher, useDataFetcher, useDataFetchers } from "../../util/dataFetcher";

const useRouterState = (): [number, string] | [-1, ''] => {
  const router = useRouter()
  const gameID = parseInt(router.query.gameID as string, 10)
  if (isNaN(gameID)) return [-1, '']

  const myURL = `${process.env.BASE_URL}/game/${gameID}`
  return [gameID, myURL]
}

interface ChoiceButtonProps {
  isLoading: boolean
  team: Team
  playerType: PlayerType
  player?: GamePlayer
}
const ChoiceButton: FunctionComponent<ChoiceButtonProps> = ({ isLoading, team, playerType, player }) => {
  const [gameID, myURL] = useRouterState()
  const [updateState, setFetchers] = useDataFetchers(myURL, [], false)

  isLoading = isLoading || updateState.isLoading

  const onClick = async () => {
    if (isLoading) return
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
      {!player && !isLoading ? undefined : (
        <span className='player'>
          {isLoading ? '...' : player!.player!.name}
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
  isLoading: boolean
  game?: GameInfo
}
const GameSetup: FunctionComponent<GameSetupProps> = ({ game, isLoading }) => {
  const playersByPosition: { [key: string]: GamePlayer | undefined } = {}
  if (!isLoading) {
    game!.players.forEach(gp => {
      playersByPosition[`${gp.team}:${gp.player_type}`] = gp
    })
  }

  return (
    <div className='game-setup-container'>
      <div className='team'>
        <h2>Blue Team</h2>
        <ChoiceButton isLoading={isLoading} team='1' playerType='codemaster' player={playersByPosition['1:codemaster']} />
        <ChoiceButton isLoading={isLoading} team='1' playerType='guesser' player={playersByPosition['1:guesser']} />
      </div>
      <div className='team'>
        <h2>Red Team</h2>
        <ChoiceButton isLoading={isLoading} team='2' playerType='codemaster' player={playersByPosition['2:codemaster']} />
        <ChoiceButton isLoading={isLoading} team='2' playerType='guesser' player={playersByPosition['2:guesser']} />
      </div>
      <style jsx>{`
      `}</style>
    </div>
  )
}

const GameSetupPage: NextPage = () => {
  const [gameID, myURL] = useRouterState()

  const createGameFetcher = (): DataFetcher<GetGameInfoResult> =>
    createDataFetcher<GetGameInfoResult>(`${process.env.API_BASE_URL}/api/game/${gameID}`)

  const [gameState, setFetcher] = useDataFetcher<GetGameInfoResult>(myURL, undefined, true)
  useEffect(() => {
    if (gameID !== -1) {
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
        io.close()
      }
    }
  }, [gameID])

  return (
    <Layout>
      <h1>Game setup</h1>
      {gameState.error ? (
        <p>ERROR: {gameState.error.message}</p>
      ) : undefined}
      <GameSetup
        game={gameState.data ? gameState.data.game : undefined}
        isLoading={gameState.isLoading}
      />
    </Layout>
  )
}

export default GameSetupPage
