import { query } from "../db"
import { TmpTmp } from "../types"

export const getTmpTmp = async (): Promise<TmpTmp[]> => {
  const results = await query('SELECT * FROM tmptmp;', [])
  return results.rows as TmpTmp[]
}
