import { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../util/auth";
import { createRequestHandler } from "../../util/requestHandler";
import { getPlayer } from "./me";
import { createGame } from '../../access/game'
import { PostGameResult } from "../../types/api";

const createGameAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  const player = await getPlayer(req)
  const gameID = await createGame(player)
  const result: PostGameResult = { gameID }
  res.status(201).json(result)
}

export default createRequestHandler({
  post: auth.requireAuthentication(createGameAPI),
})
