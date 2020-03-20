import { NextApiRequest, NextApiResponse } from "next";
import { getOrCreatePlayer } from "../../access/player";
import { GetMeResult } from "../../types/api";
import { Auth0User, Player } from "../../types/model";
import { auth } from '../../util/auth';
import { createRequestHandler } from "../../util/requestHandler";

export const getPlayer = async (req: NextApiRequest): Promise<Player> => {
  const session = await auth.getSession(req);
  const auth0User = session!.user as Auth0User
  return await getOrCreatePlayer(auth0User.sub, auth0User.name)
}

const getProfile = async (req: NextApiRequest, res: NextApiResponse) => {
  const player = await getPlayer(req)
  const result: GetMeResult = { player }
  res.status(200).json(result)
}

export default createRequestHandler({ get: auth.requireAuthentication(getProfile) })
