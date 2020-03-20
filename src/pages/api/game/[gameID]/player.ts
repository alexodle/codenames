import { NextApiRequest, NextApiResponse } from "next"
import { addPlayerToGame } from "../../../../access/gameMgmt"
import { asPlayerType, asTeam } from '../../../../types/model'
import { auth } from "../../../../util/auth"
import { createRequestHandler } from "../../../../util/requestHandler"
import { getPlayer } from "../../me"
import { getGameID } from "../[gameID]"

const putPlayerAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  const gameID = getGameID(req)
  const player = await getPlayer(req)
  await addPlayerToGame(gameID, player.id, asTeam(req.query.team), asPlayerType(req.query.playerType))
}

export default createRequestHandler({
  put: auth.requireAuthentication(putPlayerAPI),
})
