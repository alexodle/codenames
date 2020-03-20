import { Player, PlayerType, Team, GameInfo, Game, TeamBoardSpec } from "./model";

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

export interface GetGamePlayerViewRequest {
  teamBoardSpec: TeamBoardSpec
}
