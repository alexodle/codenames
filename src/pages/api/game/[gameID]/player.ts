import { NextApiRequest, NextApiResponse } from "next"
import { addPlayerToGame, getGamePlayers } from "../../../../access/gamemgmt"
import { getTeamBoardSpec } from "../../../../access/gameplay"
import { GetGamePlayerViewRequest } from "../../../../types/api"
import { asPlayerType, asTeam } from '../../../../types/model'
import { auth } from "../../../../util/auth"
import { InvalidRequestError } from "../../../../util/errors"
import { createRequestHandler } from "../../../../util/requestHandler"
import { getPlayer } from "../../me"
import { getGameID } from "../[gameID]"

const putPlayerAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  const gameID = getGameID(req)
  const player = await getPlayer(req)
  await addPlayerToGame(gameID, player.id, asTeam(req.body.team), asPlayerType(req.body.playerType))
  res.status(201).end()
}

export const getPlayerViewAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  const gameID = getGameID(req)
  const [player, gamePlayers] = await Promise.all([getPlayer(req), getGamePlayers(gameID)])

  const gamePlayer = gamePlayers.find(gp => gp.player_id === player.id)
  if (!gamePlayer) {
    throw new InvalidRequestError(`Player is not in game: ${player.id}`)
  }
  if (gamePlayer.player_type !== 'codemaster') {
    throw new InvalidRequestError('No player view for guesser')
  }

  const teamBoardSpec = await getTeamBoardSpec(gameID, gamePlayer.team)
  const result: GetGamePlayerViewRequest = { teamBoardSpec }
  res.status(200).json(result)
}

export default createRequestHandler({
  get: auth.requireAuthentication(getPlayerViewAPI),
  put: auth.requireAuthentication(putPlayerAPI),
})
