// This link is only used as a login redirect - it auto-creates a game

import fetch from 'isomorphic-unfetch';
import { NextPage, NextPageContext } from 'next';
import { PostGameResult } from '../../types/api';
import { ensureResponseOk } from '../../util/util';
import { getInitialPropsRequireAuth } from '../../util/gipAuth';
import { Player } from '../../types/model';

const NewGame: NextPage = () => (<span />)

NewGame.getInitialProps = getInitialPropsRequireAuth(async (ctx: NextPageContext, _player: Player, fetchOpts: RequestInit): Promise<{}> => {
  const createGameRes = await ensureResponseOk(await fetch(`${process.env.API_BASE_URL}/api/game`, { ...fetchOpts, method: 'POST' }))
  const result: PostGameResult = await createGameRes.json()
  const gameURL = `${process.env.BASE_URL}/game/${result.gameID}`
  if (typeof window === 'undefined') {
    ctx.res!.writeHead(302, { Location: gameURL }).end()
  } else {
    window.location.href = gameURL
  }
  return {}
})

export default NewGame
