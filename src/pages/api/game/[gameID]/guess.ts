import { NextApiRequest, NextApiResponse } from "next"
import { isNumber } from "util"
import { getGame, getGamePlayers } from "../../../../access/gamemgmt"
import { getTeamBoardSpecs, processEvents } from "../../../../access/gameplay"
import { processGuess2Player } from "../../../../game/guess"
import { PutGuessRequest } from "../../../../types/api"
import { auth } from "../../../../util/auth"
import { InvalidRequestError } from "../../../../util/errors"
import { createRequestHandler } from "../../../../util/requestHandler"
import { getPlayer } from "../../me"
import { getGameID } from "../[gameID]"

const putGuessAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  const body: PutGuessRequest = req.body
  if (!isNumber(body.col) || !isNumber(body.row) || !isNumber(body.turnNum) || !isNumber(body.turnNum)) {
    throw new InvalidRequestError('invalid request params')
  }

  const gameID = getGameID(req)

  const [player, game, boardSpecs, gamePlayers] = await Promise.all([getPlayer(req), getGame(gameID), getTeamBoardSpecs(gameID), getGamePlayers(gameID)])
  if (game.game_type !== '2player') {
    throw new InvalidRequestError('TODO') // TODO
  }

  const gamePlayer = gamePlayers.find(gp => gp.player_id === player.id)
  if (!gamePlayer) {
    throw new InvalidRequestError('Player not in game')
  }

  const events = processGuess2Player(game, boardSpecs, gamePlayer, {
    game_id: gameID,
    turn_num: body.turnNum,
    guess_num: body.guessNum,
    row: body.row,
    col: body.col
  })
  await processEvents(gameID, events)

  res.status(201).end()
}

export default createRequestHandler({
  put: auth.requireAuthentication(putGuessAPI),
})
