import { NextApiRequest, NextApiResponse } from "next"
import { getGame } from "../../../access/game"
import { GetGameResult } from "../../../types/api"
import { auth } from "../../../util/auth"
import { createRequestHandler } from "../../../util/requestHandler"

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

export default createRequestHandler({
  get: auth.requireAuthentication(getGameAPI),
})
