import { NextApiRequest, NextApiResponse } from "next";
import { createLoginState } from '../../../access/auth';
import { auth } from '../../../util/auth';
import { createRequestHandler } from "../../../util/requestHandler";

const login = async (req: NextApiRequest, res: NextApiResponse) => {
  const redirectURL = req.query.redirect as string || '/'
  const nonce = await createLoginState(redirectURL)
  await auth.handleLogin(req, res, { authParams: { state: nonce } })
}

export default createRequestHandler({ get: login })
