import { NextApiRequest, NextApiResponse } from "next"
import { isNumber } from "util"
import { getGame, getGamePlayers } from "../../../../access/gamemgmt"
import { processEvents } from "../../../../access/gameplay"
import { processPass } from "../../../../game/guess"
import { PutPassRequest } from "../../../../types/api"
import { auth } from "../../../../util/auth"
import { InvalidRequestError } from "../../../../util/errors"
import { createRequestHandler } from "../../../../util/requestHandler"
import { getPlayer } from "../../me"
import { getGameID } from "../[gameID]"

const putPassAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  const body: PutPassRequest = req.body
  if (!isNumber(body.turnNum)) {
    throw new InvalidRequestError('invalid request params')
  }

  const gameID = getGameID(req)

  const [player, game, gamePlayers] = await Promise.all([getPlayer(req), getGame(gameID), getGamePlayers(gameID)])
  if (game.game_type !== '2player') {
    throw new InvalidRequestError('TODO') // TODO
  }

  const gamePlayer = gamePlayers.find(gp => gp.player_id === player.id)
  if (!gamePlayer) {
    throw new InvalidRequestError('Player not in game')
  }

  const events = processPass(game, gamePlayer, body.turnNum)
  console.log(events)
  await processEvents(gameID, events)

  res.status(201).end()
}

export default createRequestHandler({
  put: auth.requireAuthentication(putPassAPI),
})
