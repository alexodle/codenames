import { query } from "../db"
import { Player } from "../types/model"

const getPlayer = async (sub: string): Promise<Player | undefined> => {
  const result = await query('SELECT id, name, sub FROM player WHERE sub = $1;', [sub])
  if (result.rows.length) {
    return result.rows[0] as Player
  }
  return undefined
}

export const getOrCreatePlayer = async (sub: string, name: string): Promise<Player> => {
  if (!sub) {
    throw new Error('empty sub')
  }

  let player = await getPlayer(sub)
  if (!player) {
    try {
      await query('INSERT INTO player(name, sub) VALUES($1, $2);', [name, sub])
    } catch (_e) { }
    player = await getPlayer(sub)
  }

  if (!player) {
    throw new Error('unable to create player')
  }
  return player
}
