import { NextApiRequest, NextApiResponse } from "next"
import { isNumber } from "util"
import { getGameInfo, getTurn, getGame, getGameBoard, getGamePlayers } from "../../../../access/gamemgmt"
import { setHint } from "../../../../access/gameplay"
import { PutHintRequest } from "../../../../types/api"
import { auth } from "../../../../util/auth"
import { InvalidRequestError } from "../../../../util/errors"
import { createRequestHandler } from "../../../../util/requestHandler"
import { getPlayer } from "../../me"
import { getGameID } from "../[gameID]"
import { isValidHint, isValidHintQuick } from "../../../../util/util"

const putHintAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  const body: PutHintRequest = req.body
  if (!isValidHintQuick(body.hint) || !isNumber(body.hintNum) || !isNumber(body.turnNum)) {
    throw new InvalidRequestError('invalid request params')
  }

  const gameID = getGameID(req)
  const [player, gameInfo, gamePlayers, board] = await Promise.all([getPlayer(req), getGameInfo(gameID), getGamePlayers(gameID), getGameBoard(gameID)])
  if (!gameInfo.current_turn_num) {
    throw new InvalidRequestError('game not started')
  }

  const gamePlayer = gamePlayers.find(gp => gp.player_id === player.id)
  if (!gamePlayer || gamePlayer.player_type !== 'codemaster') {
    throw new InvalidRequestError('player not is not codemaster')
  }

  const currentTurn = await getTurn(gameID, gameInfo.current_turn_num)
  if (currentTurn.team !== gamePlayer.team) {
    throw new InvalidRequestError('hint given out of turn')
  }

  const words = board.map(c => c.word)
  if (!isValidHint(body.hint, words)) {
    throw new InvalidRequestError('InvalidHint - WORDCONFLICT')
  }

  await setHint(gameID, body.turnNum, body.hint, body.hintNum)

  res.status(201).end()
}

export default createRequestHandler({
  put: auth.requireAuthentication(putHintAPI),
})
