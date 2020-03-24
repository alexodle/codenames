import crypto from 'crypto';
import { query } from "../db";
import { LoginState } from "../types/model";
import { NotFoundError } from "../util/errors";
import { ensureUpdated } from "./util";

export const createLoginState = async (redirectURL: string): Promise<string> => {
  const nonce = crypto.randomBytes(16).toString('base64')
  ensureUpdated('failed to create login state', await query(`
    INSERT INTO login_state(nonce, redirect_url)
    VALUES($1, $2);
    `, [nonce, redirectURL]))
  return nonce
}

export const getAndDeleteLoginState = async (nonce: string): Promise<LoginState> => {
  const result = await query<LoginState>(`
    DELETE FROM login_state
    WHERE nonce = $1
    RETURNING nonce, date_created, redirect_url;
    `, [nonce])
  if (!result.rows.length) {
    throw new NotFoundError('Login state not found')
  }
  return result.rows[0]
}
