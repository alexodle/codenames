import { Pool, QueryResult } from 'pg'

const pool = new Pool()

export const query = async <R>(text: string, values: any): Promise<QueryResult<R>> => {
  return pool.query(text, values)
}
