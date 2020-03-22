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
  myURL: string
  gameID?: number
  disabled?: boolean
}
const ChoiceButton: FunctionComponent<ChoiceButtonProps> = ({ team, playerType, player, myURL, gameID, myPlayer, disabled }) => {
  const [updateState, setFetchers] = useDataFetchers(myURL, [], false)

  const isLoading = updateState.isLoading
  const onClick = async () => {
    if (isLoading || disabled) return
    setFetchers([createDataSender<{}, PutPlayerRequest>(`${process.env.API_BASE_URL}/api/game/${gameID}/player`, 'PUT', {
      playerType,
      team,
    })])
  }

  const isMe = myPlayer && (myPlayer.id === player?.player?.id)
  const playerDisplayName = () => isMe ? <b>{player!.player!.name} (Me)</b> : player!.player!.name

  return (
    <div className='player-container' onClick={onClick}>
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

export interface GameSetupProps {
  game: Game
  myURL: string
  myPlayer: Player
}

export const GameSetup: FunctionComponent<GameSetupProps> = ({ game, myURL, myPlayer }) => {
  const [startGameState, setStartGameFetcher] = useDataFetcher<{}>(myURL, undefined, false)

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
          <h2>Blue Team</h2>
          <ChoiceButton
            myPlayer={myPlayer}
            team='1'
            playerType='codemaster'
            player={codemaster1}
            myURL={myURL}
            gameID={gameID}
            disabled={disabled}
          />
          <ChoiceButton
            myPlayer={myPlayer}
            team='1'
            playerType='guesser'
            player={guessers1[0]}
            myURL={myURL}
            gameID={gameID}
            disabled={disabled}
          />
        </div>
        <div className='team'>
          <h2>Red Team</h2>
          <ChoiceButton
            myPlayer={myPlayer}
            team='2'
            playerType='codemaster'
            player={codemaster2}
            myURL={myURL}
            gameID={gameID}
            disabled={disabled}
          />
          <ChoiceButton
            myPlayer={myPlayer}
            team='2'
            playerType='guesser'
            player={guessers2[0]}
            myURL={myURL}
            gameID={gameID}
            disabled={disabled}
          />
        </div>
      </div>
      {!isMyGame ? undefined : (
        <div className='start-buttons'>
          <button onClick={startGame} disabled={!startGameState.isLoading && gameType !== '2player'}>Start 2 player game</button>
          {' '}
          <button onClick={startGame} disabled={!startGameState.isLoading && gameType !== '4player'}>Start 4 player game</button>
        </div>
      )}
      <style jsx>
        {`
          .start-buttons {
            margin-top: 20px;
          }
        `}
      </style>
    </div>
  )
}
