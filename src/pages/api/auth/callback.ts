import { NextApiRequest, NextApiResponse } from "next";
import { auth } from '../../../util/auth';
import { createRequestHandler } from "../../../util/requestHandler";

const callback = async (req: NextApiRequest, res: NextApiResponse) => {
  await auth.handleCallback(req, res, { redirectTo: `${process.env.BASE_URL}/dash` })
}

export default createRequestHandler({ get: callback })
