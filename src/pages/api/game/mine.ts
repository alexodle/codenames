import { NextApiRequest, NextApiResponse } from "next";
import { getGameInfosByPlayer } from "../../../access/gamemgmt";
import { GetMyGamesResult } from "../../../types/api";
import { auth } from "../../../util/auth";
import { createRequestHandler } from "../../../util/requestHandler";
import { getPlayer } from "../me";

const ACTIVE_LIMIT = 20
const UNSTARTED_LIMIT = 5
const COMPLETED_LIMIT = 5

const getMyGamesAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  const player = await getPlayer(req)

  const [unstartedGames, activeGames, completedGames] = await Promise.all([
    getGameInfosByPlayer(player.id, 'unstarted', UNSTARTED_LIMIT),
    getGameInfosByPlayer(player.id, 'active', ACTIVE_LIMIT),
    getGameInfosByPlayer(player.id, 'completed', COMPLETED_LIMIT),
  ])

  const result: GetMyGamesResult = { unstartedGames, activeGames, completedGames }
  res.status(200).json(result)
}

export default createRequestHandler({
  get: auth.requireAuthentication(getMyGamesAPI)
})
