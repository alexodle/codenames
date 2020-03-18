import fetch from 'isomorphic-unfetch';
import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { TmpTmp } from '../types';

const GamePage: NextPage = () => {
  const [tmpData, setTmpData] = useState<TmpTmp[]>()
  const [err, setErr] = useState<string>()

  useEffect(() => {
    let cancelled = false

    const fetchTmpTmp = async () => {
      try {
        const res = await fetch(`${process.env.API_BASE_URL}/api/tmp`)
        if (!res.ok) {
          throw new Error(`/api/tmp error: ${res.statusText} (${res.status})`)
        }
        const tmptmp = await res.json()
        if (!cancelled) {
          setTmpData(tmptmp.tmptmp)
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e.message)
        }
      }
    }
    fetchTmpTmp()

    return () => {
      cancelled = true
    }
  }, [])

  const renderBody = () => {
    if (err !== undefined) {
      return <p>ERROR: {err}</p>
    } else if (tmpData === undefined) {
      return <p>Loading...</p>
    } else if (tmpData.length === 0) {
      return <p>No results</p>
    }
    return (
      <ol>
        {tmpData.map(t => (
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
