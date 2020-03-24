import fetch from 'isomorphic-unfetch';
import { NextPageContext } from 'next';
import { GetMeResult } from "../types/api";
import { Player } from "../types/model";
import { InvalidSessionError } from './errors';
import { ensureResponseOk } from './util';

export type GetInitialPropsFunc<T = {}> = (ctx: NextPageContext) => T | Promise<T>

export type AuthedGetInitialPropsFunc<T = {}> = (ctx: NextPageContext, player: Player, fetchOpts: RequestInit) => T | Promise<T>

export const getInitialPropsRequireAuth = <T = {}>(getInitialProps: AuthedGetInitialPropsFunc<T>): GetInitialPropsFunc<T> => {
  return async (ctx: NextPageContext): Promise<T> => {
    const fetchOpts = getFetchOpts(ctx)
    const player = await getPlayerInInitialProps(ctx, fetchOpts)
    if (!player) {
      // we will be redirected to login so just return empty
      return undefined as any as T
    }
    return getInitialProps(ctx, player, fetchOpts)
  }
}

export const getFetchOpts = (ctx: NextPageContext): RequestInit => {
  const opts: RequestInit = { credentials: 'same-origin' }
  if (typeof window === 'undefined') {
    opts.headers = { cookie: ctx.req?.headers.cookie! }
  }
  return opts
}

const getPlayerInInitialProps = async (ctx: NextPageContext, fetchOpts: RequestInit): Promise<Player | undefined> => {
  try {
    const meRes = await ensureResponseOk(await fetch(`${process.env.API_BASE_URL}/api/me`, fetchOpts))
    const meResult: GetMeResult = await meRes.json()
    return meResult.player

  } catch (e) {
    if (e instanceof InvalidSessionError) {
      if (typeof window === 'undefined') {
        ctx.res!.writeHead(302, {
          Location: `/api/auth/login?redirect=${encodeURIComponent(`${process.env.BASE_URL}${ctx.req!.url!}`)}`
        }).end()
      } else {
        window.location.href = `/api/auth/login?redirect=${encodeURIComponent(window.location.href)}`
      }
      return
    }

    throw e
  }
}
