import { useState, useEffect } from "react"
import { InvalidSessionError } from "./errors"

export type DataFetcher<R> = () => Promise<R>

export type LoadingState =
  | { isLoading: true, error: undefined, data: undefined }
  | { isLoading: false, error: Error, data: undefined }

export type DataState<R> = LoadingState | { isLoading: false, error: undefined, data: R }
export type DataState0<R> = LoadingState | { isLoading: false, error: undefined, data: R[] }
export type DataState1<R1> = LoadingState | { isLoading: false, error: undefined, data: [R1] }
export type DataState2<R1, R2> = LoadingState | { isLoading: false, error: undefined, data: [R1, R2] }
export type DataState3<R1, R2, R3> = LoadingState | { isLoading: false, error: undefined, data: [R1, R2, R3] }

const AUTH_ERRORS = [401, 402, 403]

function ensureResponseOk(res: Response): Response {
  if (!res.ok) {
    if (AUTH_ERRORS.includes(res.status)) {
      throw new InvalidSessionError()
    } else {
      throw new Error(`error: ${res.statusText} (${res.status})`)
    }
  }
  return res
}

export function createDataFetcher<R>(fullURL: string): DataFetcher<R> {
  return async (): Promise<R> => {
    const res = ensureResponseOk(await fetch(fullURL))
    return await res.json() as R
  }
}

export function createDataSender<R, T>(fullURL: string, method: 'POST' | 'PUT', data: T): DataFetcher<R> {
  return async (): Promise<R> => {
    const res = ensureResponseOk(await fetch(fullURL, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }))
    return await res.json() as R
  }
}

export function useDataFetcher<R>(srcURL: string, initialFetcher: DataFetcher<R> | undefined, initialIsLoading: boolean): [DataState<R>, (fetcher: DataFetcher<R> | undefined) => void] {
  const [state, setFetchers] = useDataFetchers(srcURL, initialFetcher ? [initialFetcher] : [], initialIsLoading)
  const myState = state.data === undefined ? state : { isLoading: false, error: undefined, data: state.data[0] }
  return [myState as DataState<R>, (fetcher: DataFetcher<R> | undefined) => setFetchers(fetcher ? [fetcher] : [])]
}

export function useDataFetchers(srcURL: string, initialFetchers: DataFetcher<any>[], initialIsLoading: boolean = true): [DataState<any>, (fetchers: DataFetcher<any>[]) => void] {
  const [fetchers, setFetchers] = useState<DataFetcher<any>[]>(initialFetchers)
  const [state, setState] = useState<DataState<any>>({ isLoading: initialIsLoading, error: undefined, data: undefined })

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      if (!fetchers.length) return
      try {
        setState({ isLoading: true, error: undefined, data: undefined })
        const datas = await Promise.all(fetchers.map(f => f()))
        if (!cancelled) {
          setState({ isLoading: false, error: undefined, data: datas })
        }
      } catch (e) {
        if (!cancelled) {
          if (e instanceof InvalidSessionError) {
            window.location.href = `/api/auth/login?redirect=${encodeURI(srcURL)}`
            return
          }
          setState({ isLoading: false, error: e, data: undefined })
        }
      }
    }
    fetchData()

    return () => {
      cancelled = true
    }
  }, [fetchers])

  return [state, setFetchers]
}
