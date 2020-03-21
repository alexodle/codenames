import { QueryResult } from 'pg'
import { InvalidRequestError } from '../util/errors'

export const ensureUpdated = <R>(errMsg: string, result: QueryResult<R>): QueryResult<R> => {
  if (!result.rowCount) {
    throw new InvalidRequestError(errMsg)
  }
  return result
}
