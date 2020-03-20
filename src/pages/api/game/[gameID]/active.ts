import { NextApiRequest, NextApiResponse } from "next"
import { getActiveGame } from "../../../../access/gameMgmt"
import { GetActiveGameResult } from "../../../../types/api"
import { ActiveGame } from "../../../../types/model"
import { auth } from "../../../../util/auth"
import { createRequestHandler } from "../../../../util/requestHandler"
import { getGameID } from "../[gameID]"

const getActiveGameAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  const gameID = getGameID(req)
  const game: ActiveGame = await getActiveGame(gameID)
  const result: GetActiveGameResult = { game }
  res.status(200).json(result)
}

export default createRequestHandler({
  get: auth.requireAuthentication(getActiveGameAPI),
})
