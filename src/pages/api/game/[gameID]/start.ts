import { NextApiRequest, NextApiResponse } from "next"
import { getGameInfo, startGame } from "../../../../access/gamemgmt"
import { auth } from "../../../../util/auth"
import { InvalidRequestError } from "../../../../util/errors"
import { createRequestHandler } from "../../../../util/requestHandler"
import { getPlayer } from "../../me"
import { getGameID } from "../[gameID]"

const startGameAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  const gameID = getGameID(req)
  const [player, game] = await Promise.all([getPlayer(req), getGameInfo(gameID)])
  if (game.created_by_player_id !== player.id) {
    throw new InvalidRequestError('Game can only be started by creator')
  }
  await startGame(gameID)
  res.status(201).end()
}

export default createRequestHandler({
  put: auth.requireAuthentication(startGameAPI),
})
