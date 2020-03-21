import { NextApiRequest, NextApiResponse } from "next"
import { isNumber } from "util"
import { getGameInfo, getTurn } from "../../../../access/gamemgmt"
import { setHint } from "../../../../access/gameplay"
import { PutHintRequest } from "../../../../types/api"
import { auth } from "../../../../util/auth"
import { InvalidRequestError } from "../../../../util/errors"
import { createRequestHandler } from "../../../../util/requestHandler"
import { getPlayer } from "../../me"
import { getGameID } from "../[gameID]"

const putHintAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  const body: PutHintRequest = req.body
  if (!body.hint || !isNumber(body.hintNum) || !isNumber(body.turnNum)) {
    throw new InvalidRequestError('invalid request params')
  }

  const gameID = getGameID(req)
  const [player, game] = await Promise.all([getPlayer(req), getGameInfo(gameID)])

  const gamePlayer = game.players.find(gp => gp.player_id === player.id)
  if (!gamePlayer || gamePlayer.player_type !== 'codemaster') {
    throw new InvalidRequestError('player not is not codemaster')
  }

  const currentTurn = await getTurn(gameID, game.current_turn_num)
  if (currentTurn.team !== gamePlayer.team) {
    throw new InvalidRequestError('hint given out of turn')
  }

  await setHint(gameID, body.turnNum, body.hint, body.hintNum)

  res.status(201).end()
}

export default createRequestHandler({
  put: auth.requireAuthentication(putHintAPI),
})
