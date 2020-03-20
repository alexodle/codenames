import { Pool, QueryResult, PoolClient } from 'pg'

const pool = new Pool()

export interface Client {
  query<R>(text: string, values: any): Promise<QueryResult<R>>
}

export const getRawClient = async (): Promise<PoolClient> => await pool.connect()

export const query = async <R>(text: string, values: any): Promise<QueryResult<R>> => {
  return pool.query(text, values)
}

export const withTransaction = async (cb: (client: Client) => Promise<void>) => {
  // note: we don't try/catch this because if connecting throws an exception
  // we don't need to dispose of the client (it will be undefined)
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
