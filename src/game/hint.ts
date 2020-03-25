import { Game, GameEvent, GamePlayer, HintEvent } from "../types/model"
import { InvalidRequestError } from "../util/errors"
import { isValidHint } from "../util/util"

export const processHint = (game: Game, gamePlayer: GamePlayer, turnNum: number, hint: string, hintNum: number): GameEvent[] => {
  if (hintNum < 1) {
    throw new InvalidRequestError('invalid hint num')
  }
  if (!game.current_turn_num) {
    throw new InvalidRequestError('game not started')
  }
  if (game.current_turn_num !== turnNum) {
    throw new InvalidRequestError('wrong turn num')
  }
  if (gamePlayer.player_type !== 'codemaster') {
    throw new InvalidRequestError('player not is not codemaster')
  }
  if (game.currentTurn!.team !== gamePlayer.team) {
    throw new InvalidRequestError('hint given out of turn')
  }

  const words = game.board.map(c => c.word)
  if (!isValidHint(hint, words)) {
    throw new InvalidRequestError('InvalidHint - WORDCONFLICT')
  }

  const hintEvent: HintEvent = { type: 'hint', turnNum, hint, hintNum }
  return [hintEvent]
}
