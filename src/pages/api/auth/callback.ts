import { NextApiRequest, NextApiResponse } from "next";
import { auth } from '../../../util/auth';
import { createRequestHandler } from "../../../util/requestHandler";
import { InvalidRequestError } from "../../../util/errors";
import { getAndDeleteLoginState } from "../../../access/auth";

const THRESHOLD_MILLIS = 10 * 60 * 1000 // 10 mins

const callback = async (req: NextApiRequest, res: NextApiResponse) => {
  const nonce = req.query.state as string
  if (!nonce) {
    throw new InvalidRequestError('Missing state in auth0 callback')
  }

  const loginState = await getAndDeleteLoginState(nonce)
  if (!loginState) {
    throw new InvalidRequestError('Login state not found')
  }
  if (Date.now() - loginState.date_created.getTime() > THRESHOLD_MILLIS) {
    throw new InvalidRequestError('Login callback threshold breached')
  }

  await auth.handleCallback(req, res, { redirectTo: loginState.redirect_url })
}

export default createRequestHandler({ get: callback })
