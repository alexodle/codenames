import { useState, useEffect } from "react"

type DataState<T> =
  | { isLoading: true, error: undefined, data: undefined }
  | { isLoading: false, error: Error, data: undefined }
  | { isLoading: false, error: undefined, data: T }

export function useDataFetcher<T>(fullURL: string): DataState<T> {
  const [state, setState] = useState<DataState<T>>({ isLoading: true, error: undefined, data: undefined })

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        setState({ isLoading: true, error: undefined, data: undefined })
        const res = await fetch(fullURL)
        if (!res.ok) {
          throw new Error(`${fullURL} error: ${res.statusText} (${res.status})`)
        }
        const data: T = await res.json()
        if (!cancelled) {
          setState({ isLoading: false, error: undefined, data })
        }
      } catch (e) {
        if (!cancelled) {
          setState({ isLoading: false, error: e, data: undefined })
        }
      }
    }
    fetchData()

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
