import fetch from 'isomorphic-unfetch';
import { NextPage } from 'next';
import { Reducer, useEffect, useReducer } from 'react';
import { Layout } from '../components/layout';
import { TmpTmp } from '../types';

type DataStateAction<T> =
  | { type: 'request' }
  | { type: 'success', result: T }
  | { type: 'failure', error: Error };

type DataState<T> =
  | { isLoading: true, error: undefined, data: undefined }
  | { isLoading: false, error: Error, data: undefined }
  | { isLoading: false, error: undefined, data: T }

function dataStateReducer<T>(prevState: DataState<T>, action: DataStateAction<T>): DataState<T> {
  switch (action.type) {
    case 'request':
      return { isLoading: true, error: undefined, data: undefined }
    case 'success':
      return { isLoading: false, error: undefined, data: action.result }
    case 'failure':
      return { isLoading: false, error: action.error, data: undefined }
  }
}

const GamePage: NextPage = () => {
  const [tmpDataState, dispatchTmpDataState] = useReducer<Reducer<DataState<TmpTmp[]>, DataStateAction<TmpTmp[]>>>(dataStateReducer, { isLoading: true, error: undefined, data: undefined })

  useEffect(() => {
    let cancelled = false

    const fetchTmpTmp = async () => {
      try {
        dispatchTmpDataState({ type: 'request' })
        const res = await fetch(`${process.env.API_BASE_URL}/api/tmp`)
        if (!res.ok) {
          throw new Error(`/api/tmp error: ${res.statusText} (${res.status})`)
        }
        const tmptmp = await res.json()
        if (!cancelled) {
          dispatchTmpDataState({ type: 'success', result: tmptmp.tmptmp })
        }
      } catch (e) {
        if (!cancelled) {
          dispatchTmpDataState({ type: 'failure', error: e })
        }
      }
    }
    fetchTmpTmp()

    return () => {
      cancelled = true
    }
  }, [])

  const renderBody = () => {
    if (tmpDataState.isLoading) {
      return <p>Loading...</p>
    } else if (tmpDataState.error) {
      return <p>ERROR: {tmpDataState.error.message}</p>
    } else if (tmpDataState.data.length === 0) {
      return <p>No results</p>
    }
    return (
      <ol>
        {tmpDataState.data.map(t => (
          <li key={t.id}>{t.id} - {t.tmp}</li>
        ))}
      </ol>
    )
  }

  return (
    <Layout>
      <h1>Hi there</h1>
      <p>And welcome</p>
      <h2>Results:</h2>
      {renderBody()}
    </Layout>
  )
}

export default GamePage
