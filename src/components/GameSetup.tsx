import { FunctionComponent, SyntheticEvent } from "react";
import { PutPlayerRequest } from "../types/api";
import { Game, GamePlayer, GameType, Player, PlayerType, Team } from "../types/model";
import { createDataSender, useDataFetcher, useDataFetchers } from "../util/dataFetcher";
import { playersByPosition } from "../util/util";

interface ChoiceButtonProps {
  team: Team
  playerType: PlayerType
  player?: GamePlayer
  myPlayer?: Player
  gameID?: number
  disabled?: boolean
}
const ChoiceButton: FunctionComponent<ChoiceButtonProps> = ({ team, playerType, player, gameID, myPlayer, disabled }) => {
  const [updateState, setFetchers] = useDataFetchers([], false)

  const isLoading = updateState.isLoading
  const onClick = async () => {
    setFetchers([createDataSender<{}, PutPlayerRequest>(`${process.env.API_BASE_URL}/api/game/${gameID}/player`, 'PUT', {
      playerType,
      team,
    })])
  }

  const isMe = myPlayer && (myPlayer.id === player?.player?.id)
  const playerDisplayName = () => isMe ? <b>{player!.player!.name} (Me)</b> : player!.player!.name

  const clickable = !isLoading && !disabled && !player
  return (
    <div className={`player-container ${clickable ? 'clickable' : undefined}`} onClick={clickable ? onClick : undefined}>
      <span className='player-type'>
        {playerType === 'codemaster' ? 'CODEMASTER' : 'GUESSER'}
      </span>
      {!player && !isLoading ? undefined : (
        <span className='player'>
          {isLoading ? '...' : playerDisplayName()}
        </span>
      )}
      <style jsx>{`
        .player-container {
          border: 1px solid gray;
          border-radius: 10px;
          height: 80px;
          width: 140px;
          margin-bottom: 20px;
          padding: 10px;
          text-align: center;
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
  game: Game
  myPlayer: Player
}

export const GameSetup: FunctionComponent<GameSetupProps> = ({ game, myPlayer }) => {
  const [startGameState, setStartGameFetcher] = useDataFetcher<{}>(undefined, false)

  const [codemaster1, codemaster2, guessers1, guessers2] = playersByPosition(game.players)

  let gameType: GameType | undefined = undefined
  if (codemaster1 && codemaster2) {
    if (!guessers1.length && !guessers2.length) {
      gameType = '2player'
    } else if (guessers1.length && guessers2.length) {
      gameType = '4player'
    }
  }

  const gameID = game.id
  const isMyGame = myPlayer.id === game.created_by_player_id

  const startGame = (ev: SyntheticEvent) => {
    ev.preventDefault()
    setStartGameFetcher(createDataSender(`${process.env.API_BASE_URL}/api/game/${gameID}/start`, 'PUT', {}))
  }

  const disabled = startGameState.isLoading
  return (
    <div>
      <h2>Game setup</h2>
      <div className='game-setup-container'>
        <div className='team'>
          <h3>Blue Team</h3>
          <ChoiceButton
            myPlayer={myPlayer}
            team='1'
            playerType='codemaster'
            player={codemaster1}
            gameID={gameID}
            disabled={disabled}
          />
          <ChoiceButton
            myPlayer={myPlayer}
            team='1'
            playerType='guesser'
            player={guessers1[0]}
            gameID={gameID}
            disabled={disabled}
          />
        </div>
        <div className='team'>
          <h3>Red Team</h3>
          <ChoiceButton
            myPlayer={myPlayer}
            team='2'
            playerType='codemaster'
            player={codemaster2}
            gameID={gameID}
            disabled={disabled}
          />
          <ChoiceButton
            myPlayer={myPlayer}
            team='2'
            playerType='guesser'
            player={guessers2[0]}
            gameID={gameID}
            disabled={disabled}
          />
        </div>
      </div>
      {!isMyGame ? undefined : (
        <div className='start-buttons'>
          <button onClick={startGame} disabled={startGameState.isLoading || gameType !== '2player'}>Start 2 player game</button>
          {' '}
          <button onClick={startGame} disabled={startGameState.isLoading || gameType !== '4player'}>Start 4 player game</button>
        </div>
      )}
      <style jsx>
        {`
          .start-buttons {
            margin-top: 20px;
          }

          .game-setup-container {
            display: grid;
            grid-column-gap: 30px;
            grid-template-columns: 1fr 1fr;
          }
        `}
      </style>
    </div>
  )
}
