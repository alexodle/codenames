import { Pool, QueryResult, PoolClient } from 'pg'

const pool = new Pool()

export interface Client {
  query<R>(text: string, values: any): Promise<QueryResult<R>>
}

export const getRawClient = async (): Promise<PoolClient> => await pool.connect()

export const query = async <R>(text: string, values: any, client?: Client): Promise<QueryResult<R>> => {
  return await (client ? client.query(text, values) : pool.query(text, values))
}

export const withTransaction = async (cb: (client: Client) => Promise<void>) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await cb(client)
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
