import { useState, useEffect } from "react"
import { InvalidSessionError } from "./errors"
import { ensureResponseOk } from "./util"

export type DataFetcher<R> = () => Promise<R>

export interface DataState<R> {
  isLoading: boolean
  completed: boolean
  error?: Error
  data?: R | undefined
}

export function createDataFetcher<R>(fullURL: string): DataFetcher<R> {
  return async (): Promise<R> => {
    const res = await ensureResponseOk(await fetch(fullURL))
    return await res.json() as R
  }
}

export function createDataSender<R, T>(fullURL: string, method: 'POST' | 'PUT', data: T): DataFetcher<R> {
  return async (): Promise<R> => {
    const res = await ensureResponseOk(await fetch(fullURL, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }))
    return await res.json() as R
  }
}

export function useDataFetcher<R>(initialFetcher: DataFetcher<R> | undefined, initialIsLoading: boolean): [DataState<R>, (fetcher: DataFetcher<R> | undefined) => void] {
  const [state, setFetchers] = useDataFetchers(initialFetcher ? [initialFetcher] : [], initialIsLoading)
  const myState = state.data === undefined ? state : { ...state, data: state.data[0] }
  return [myState as DataState<R>, (fetcher: DataFetcher<R> | undefined) => setFetchers(fetcher ? [fetcher] : [])]
}

export function useDataFetchers(initialFetchers: DataFetcher<any>[], initialIsLoading: boolean = true): [DataState<any>, (fetchers: DataFetcher<any>[]) => void] {
  const [fetchers, setFetchers] = useState<DataFetcher<any>[]>(initialFetchers)
  const [state, setState] = useState<DataState<any>>({ isLoading: initialIsLoading, error: undefined, data: undefined, completed: false })

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      if (!fetchers.length) {
        setState({ ...state, error: undefined, data: undefined, completed: false })
        return
      }

      try {
        setState({ ...state, isLoading: true, error: undefined, completed: false })
        const datas = await Promise.all(fetchers.map(f => f()))
        if (!cancelled) {
          setState({ isLoading: false, error: undefined, data: datas, completed: true })
        }
      } catch (e) {
        if (!cancelled) {
          if (e instanceof InvalidSessionError) {
            window.location.href = `/api/auth/login?redirect=${encodeURIComponent(window.location.href)}`
            return
          }
          setState({ ...state, isLoading: false, error: e, completed: true })
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
