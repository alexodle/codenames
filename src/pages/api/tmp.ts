import { createRequestHandler } from '../../util/requestHandler';
import { getTmpTmp } from '../../access';
import { NextApiRequest, NextApiResponse } from 'next';
import { GetTmpTmpApiResult } from '../../types';

const getTmp = async (_req: NextApiRequest, res: NextApiResponse) => {
  const results = await getTmpTmp()
  const data: GetTmpTmpApiResult = { tmptmp: results }
  res.status(200).json(data)
}

export default createRequestHandler({ get: getTmp })
