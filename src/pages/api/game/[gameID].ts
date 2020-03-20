import { NextApiRequest, NextApiResponse } from "next"
import { getGameInfo } from "../../../access/gameMgmt"
import { GetGameInfoResult } from "../../../types/api"
import { GameInfo } from "../../../types/model"
import { auth } from "../../../util/auth"
import { createRequestHandler } from "../../../util/requestHandler"

export const getGameID = (req: NextApiRequest): number => {
  const { gameID } = req.query
  return parseInt(gameID as string, 10)
}

const getGameAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  const gameID = getGameID(req)
  const game: GameInfo = await getGameInfo(gameID)
  const result: GetGameInfoResult = { game }
  res.status(200).json(result)
}

export default createRequestHandler({
  get: auth.requireAuthentication(getGameAPI),
})
