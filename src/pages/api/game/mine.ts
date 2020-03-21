import { NextApiRequest, NextApiResponse } from "next";
import { getInProgressGameInfosByPlayer } from "../../../access/gamemgmt";
import { GetMyGamesResult } from "../../../types/api";
import { auth } from "../../../util/auth";
import { createRequestHandler } from "../../../util/requestHandler";
import { getPlayer } from "../me";

const getMyGamesAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  const player = await getPlayer(req)
  const games = await getInProgressGameInfosByPlayer(player.id)
  const result: GetMyGamesResult = { games }
  res.status(200).json(result)
}

export default createRequestHandler({
  get: auth.requireAuthentication(getMyGamesAPI)
})
