import { NextApiRequest, NextApiResponse } from "next";
import { auth } from '../../../util/auth';
import { createRequestHandler } from "../../../util/requestHandler";

const login = async (req: NextApiRequest, res: NextApiResponse) => {
  await auth.handleLogin(req, res, {})
}

export default createRequestHandler({ get: login })
