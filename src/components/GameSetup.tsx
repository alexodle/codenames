import { FunctionComponent, SyntheticEvent, useState, useEffect } from "react";
import { PutPlayerRequest } from "../types/api";
import { GamePlayer, GameType, Player, PlayerType, Team } from "../types/model";
import { createDataSender, useDataFetcher } from "../util/dataFetcher";
import { playersByPosition } from "../util/util";
import { PrimaryButton } from "./form/Button";
import { useGameContext } from "./GameContext";
import { useThemeContext } from "./ThemeContext";
import { useRouter } from "next/router";

interface ChoiceButtonProps {
  team: Team
  playerType: PlayerType
  player?: GamePlayer
  myPlayer: Player
}
const ChoiceButton: FunctionComponent<ChoiceButtonProps> = ({ team, playerType, player, myPlayer }) => {
  const { game, gameInvalidated, invalidateGame } = useGameContext()
  const theme = useThemeContext()

  const [, setFetcher] = useDataFetcher(undefined, false)
  const onClick = async () => {
    invalidateGame()
    setFetcher(createDataSender<{}, PutPlayerRequest>(`${process.env.API_BASE_URL}/api/game/${game.id}/player`, 'PUT', {
      playerType,
      team,
    }))
  }

  const isMe = myPlayer && (myPlayer.id === player?.player?.id)
  const playerDisplayName = () => isMe ? <b>{player!.player!.name} (Me)</b> : player!.player!.name

  const clickable = !gameInvalidated && !player
  return (
    <div className={`player-container ${clickable ? 'clickable' : ''}`} onClick={clickable ? onClick : undefined}>
      <span className='player-type'>
        {playerType === 'codemaster' ? 'CODEMASTER' : 'GUESSER'}
      </span>
      {!player ? undefined : (
        <span className='player'>
          {playerDisplayName()}
        </span>
      )}
      <style jsx>{`
        .player-container {
          border: 1px solid gray;
          border-radius: 10px;
          height: 80px;
          width: 100%;
          margin-bottom: 20px;
          padding: 10px;
          text-align: center;
          background-color: ${theme.teams[team].light}
        }
        .player-type {
          display: block;
        }
        .player {
          display: block;
          margin-top: 10px;
        }
      `}</style>
    </div>
  )
}

export interface GameSetupProps {
  myPlayer: Player
}
export const GameSetup: FunctionComponent<GameSetupProps> = ({ myPlayer }) => {
  const { game, gameInvalidated, invalidateGame } = useGameContext()

  const [inviteLink, setInviteLink] = useState('...')
  useEffect(() => {
    setInviteLink(window.location.href)
  }, [])

  const [codemaster1, codemaster2, guessers1, guessers2] = playersByPosition(game.players)
  const isMyGame = myPlayer.id === game.created_by_player_id

  let gameType: GameType | undefined = undefined
  if (codemaster1 && codemaster2) {
    if (!guessers1.length && !guessers2.length) {
      gameType = '2player'
    } else if (guessers1.length && guessers2.length) {
      gameType = '4player'
    }
  }

  const [, setStartGameFetcher] = useDataFetcher<{}>(undefined, false)
  const startGame = (ev: SyntheticEvent) => {
    ev.preventDefault()
    invalidateGame()
    setStartGameFetcher(createDataSender(`${process.env.API_BASE_URL}/api/game/${game.id}/start`, 'PUT', {}))
  }

  return (
    <div>
      <h2>Game setup</h2>
      <p className='invite'>
        Invite your friends by sending them this link: <b>{inviteLink}</b>
      </p>
      <div className='game-setup-container'>
        <div className='team'>
          <h3>Blue Team</h3>
          <ChoiceButton
            myPlayer={myPlayer}
            team='1'
            playerType='codemaster'
            player={codemaster1}
          />
          {/* <ChoiceButton
            myPlayer={myPlayer}
            team='1'
            playerType='guesser'
            player={guessers1[0]}
          /> */}
        </div>
        <div className='team'>
          <h3>Yellow Team</h3>
          <ChoiceButton
            myPlayer={myPlayer}
            team='2'
            playerType='codemaster'
            player={codemaster2}
          />
          {/* <ChoiceButton
            myPlayer={myPlayer}
            team='2'
            playerType='guesser'
            player={guessers2[0]}
          /> */}
        </div>
      </div>
      {!isMyGame ? undefined : (
        <div className='start-buttons'>
          <PrimaryButton fullWidth onClick={startGame} disabled={gameInvalidated || gameType !== '2player'}>Start 2 player game</PrimaryButton>
          {' '}
          <PrimaryButton fullWidth onClick={startGame} disabled={true}>Start 4 player game (Coming soon)</PrimaryButton>
        </div>
      )}
      <style jsx>
        {`
          .team {
            text-align: center;
          }
          .start-buttons {
            margin-top: 20px;
          }
          .game-setup-container {
            display: grid;
            grid-column-gap: 30px;
            grid-template-columns: 1fr 1fr;
          }
          .invite {
            margin-bottom: 30px;
            font-size: 90%;
          }
        `}
      </style>
    </div>
  )
}
