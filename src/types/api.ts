import { Player, PlayerType, Team, GameInfo, ActiveGame } from "./model";

export interface GetMeResult {
  player: Player
}

export interface GetMyGamesResult {
  games: GameInfo[]
}

export interface GetGameInfoResult {
  game: GameInfo
}

export interface GetActiveGameResult {
  game: ActiveGame
}

export interface PostGameResult {
  gameID: number
}

export interface PutPlayerRequest {
  playerType: PlayerType
  team: Team
}
