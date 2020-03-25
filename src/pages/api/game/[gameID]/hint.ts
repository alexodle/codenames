import { NextApiRequest, NextApiResponse } from "next"
import { isNumber } from "util"
import { getGame } from "../../../../access/gamemgmt"
import { processEvents } from "../../../../access/gameplay"
import { processHint } from "../../../../game/hint"
import { PutHintRequest } from "../../../../types/api"
import { auth } from "../../../../util/auth"
import { InvalidRequestError } from "../../../../util/errors"
import { createRequestHandler } from "../../../../util/requestHandler"
import { isValidHintQuick } from "../../../../util/util"
import { getPlayer } from "../../me"
import { getGameID } from "../[gameID]"

const putHintAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  const body: PutHintRequest = req.body
  if (!isValidHintQuick(body.hint) || !isNumber(body.hintNum) || !isNumber(body.turnNum)) {
    throw new InvalidRequestError('invalid request params')
  }

  const gameID = getGameID(req)
  const [player, game] = await Promise.all([getPlayer(req), getGame(gameID)])

  const gamePlayer = game.players.find(gp => gp.player_id === player.id)
  if (!gamePlayer) {
    throw new InvalidRequestError('player not in game')
  }

  const events = processHint(game, gamePlayer, body.turnNum, body.hint, body.hintNum)
  await processEvents(gameID, events)

  res.status(201).end()
}

export default createRequestHandler({
  put: auth.requireAuthentication(putHintAPI),
})
