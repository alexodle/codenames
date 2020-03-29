import { NextApiRequest, NextApiResponse } from "next"
import { deleteGame, getGame, getGameInfo } from "../../../access/gamemgmt"
import { GetGameResult } from "../../../types/api"
import { auth } from "../../../util/auth"
import { InvalidRequestError } from "../../../util/errors"
import { createRequestHandler } from "../../../util/requestHandler"
import { getPlayer } from "../me"

export const getGameID = (req: NextApiRequest): number => {
  const { gameID } = req.query
  return parseInt(gameID as string, 10)
}

const getGameAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  const gameID = getGameID(req)
  const game = await getGame(gameID)
  const result: GetGameResult = { game }
  res.status(200).json(result)
}

const deleteGameAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  const gameID = getGameID(req)

  const [player, gameInfo] = await Promise.all([getPlayer(req), getGameInfo(gameID)])
  if (player.id !== gameInfo.created_by_player_id) {
    throw new InvalidRequestError('Player does not own game')
  }

  await deleteGame(gameID)
  res.status(200).json({})
}

export default createRequestHandler({
  get: getGameAPI,
  delete: auth.requireAuthentication(deleteGameAPI),
})
