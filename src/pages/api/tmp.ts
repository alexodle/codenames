import { createRequestHandler } from '../../util/requestHandler';
import { getTmpTmp } from '../../access';
import { NextApiRequest, NextApiResponse } from 'next';

const getTmp = async (_req: NextApiRequest, res: NextApiResponse) => {
  const results = await getTmpTmp()
  res.status(200).json({ tmptmp: results })
}

export default createRequestHandler({ get: getTmp })
