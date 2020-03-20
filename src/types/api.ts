import { Player, PlayerType, Team, GameInfo, Game } from "./model";

export interface GetMeResult {
  player: Player
}

export interface GetMyGamesResult {
  games: GameInfo[]
}

export interface GetGameInfoResult {
  game: GameInfo
}

export interface GetGameResult {
  game: Game
}

export interface PostGameResult {
  gameID: number
}

export interface PutPlayerRequest {
  playerType: PlayerType
  team: Team
}
