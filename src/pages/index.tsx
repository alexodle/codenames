import fetch from 'isomorphic-unfetch';
import { NextPage, NextPageContext } from "next";
import Link from 'next/link';
import { useRouter } from "next/router";
import { FunctionComponent, SyntheticEvent, useEffect, useState } from "react";
import { isNullOrUndefined } from 'util';
import { PrimaryButton, Button } from "../components/form/Button";
import { Layout } from "../components/Layout";
import { PlayerContextProvider, usePlayerContext } from "../components/PlayerContext";
import { useThemeContext } from '../components/ThemeContext';
import { GetMeResult, GetMyGamesResult, PostGameResult } from "../types/api";
import { GameInfo, Player } from "../types/model";
import { createDataFetcher, createDataSender, useDataFetcher } from "../util/dataFetcher";
import { InvalidSessionError } from "../util/errors";
import { getFetchOpts } from "../util/gipAuth";
import { ensureResponseOk, sort } from "../util/util";

const formatDate = (d: Date | string): string => {
  d = new Date(d)
  return d.toLocaleDateString()
}

interface GameRowProps {
  myPlayer: Player
  game: GameInfo
  onDeleted?: (gameID: number) => void
}

const InProgressGameRow: FunctionComponent<GameRowProps> = ({ myPlayer, game }) => {
  const currentTurn = game.currentTurn!
  const myGamePlayer = game.players.find(gp => gp.player_id === myPlayer.id)!

  // TODO: add logic for 4 player
  const waitingForMyGuess = currentTurn.team !== myGamePlayer.team && !!currentTurn.hint_word
  const waitingForMyHint = myGamePlayer.player_type === 'codemaster' && currentTurn.team === myGamePlayer.team && !currentTurn.hint_word

  return (
    <span className='game-state'>
      {waitingForMyGuess ? 'Waiting on you' : undefined}
      {waitingForMyHint ? 'Waiting on you' : undefined}
      <style jsx>
        {`
          .game-state {
            position: absolute;
            right: 10px;
            font-weight: bold;
          }
        `}
      </style>
    </span>
  )
}

const CompletedGameRow: FunctionComponent<GameRowProps> = ({ myPlayer, game }) => {
  const myGamePlayer = game.players.find(gp => gp.player_id === myPlayer.id)!
  const won =
    (game.game_type === '2player' && !isNullOrUndefined(game.winning_team)) ||
    (game.game_type === '4player' && game.winning_team === myGamePlayer.team)

  return (
    <span className='game-result'>
      {won ? 'You won!' : 'You lost'}
      <style jsx>
        {`
          span {
            position: absolute;
            right: 10px;
            font-weight: bold;
          }
        `}
      </style>
    </span>
  )
}

const GameRow: FunctionComponent<GameRowProps> = ({ myPlayer, game, onDeleted }) => {
  const onDelete = (ev: SyntheticEvent) => {
    ev.preventDefault()
    if (onDeleted) {
      createDataSender(`${process.env.API_BASE_URL}/api/game/${game.id}`, 'DELETE', {})()
      onDeleted(game.id)
    }
  }

  return (
    <div className='game-row'>
      <Link href={`/game/${game.id}`}>
        <a>
          <span className='game-info game-date'>{formatDate(game.created_on)}</span>
          <span className='game-info game-nplayers'>{game.players.length} players</span>
          <span className='game-info game-players'>{sort(game.players.map(p => p.player!.name)).join(', ')}</span>
          {game.is_started && !game.game_over ? <InProgressGameRow myPlayer={myPlayer} game={game} /> : undefined}
          {game.game_over ? <CompletedGameRow myPlayer={myPlayer} game={game} /> : undefined}
        </a>
      </Link>
      {onDeleted && !game.is_started && game.created_by_player_id === myPlayer.id ? <span className='delete-btn'><Button small onClick={onDelete}>Delete</Button></span> : undefined}

      <style jsx>
        {`
          .game-row {
            position: relative;
            width: 100%;
            height: 100%;
          }
          a, a:visited {
            display: block;
            color: inherit;
            text-decoration: none;
            width: 100%;
            height: 100%;
            padding: 10px;
          }
          .game-info {
            display: inline-block;
            width: 120px;
          }
          .game-info.game-players {
            width: 480px;
          }
          .delete-btn {
            position: absolute;
            right: 10px;
            top: 7px;
          }
        `}
      </style>
    </div>
  )
}

interface GamesListProps {
  myPlayer: Player
  games: GameInfo[]
}
const GamesList: FunctionComponent<GamesListProps> = ({ myPlayer, games }) => {
  const theme = useThemeContext()

  const [deletedGames, setDeletedGames] = useState<number[]>([])
  const onDeleted = (gameID: number) => {
    setDeletedGames(state => [...state, gameID])
  }

  return (
    <ol className='games-list'>
      {!games.length ? <p>None</p> : undefined}
      {games
        .filter(g => !deletedGames.includes(g.id))
        .map(g => (
          <li key={g.id}><GameRow myPlayer={myPlayer} game={g} onDeleted={onDeleted} /></li>
        ))}
      <style jsx>
        {`
          .games-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          li {
            padding: 0;
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
              <GamesList myPlayer={player!} games={myGamesState.data.activeGames} />
              <h3>Unstarted</h3>
              <GamesList myPlayer={player!} games={myGamesState.data.unstartedGames} />
              <h3>Completed</h3>
              <GamesList myPlayer={player!} games={myGamesState.data.completedGames} />
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
