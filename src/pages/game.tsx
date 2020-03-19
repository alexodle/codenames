import { NextPage } from 'next';
import { Layout } from '../components/layout';
import { GetTmpTmpApiResult } from '../types';
import { useDataFetcher } from '../util/dataFetcher';


const GamePage: NextPage = () => {
  const tmpDataState = useDataFetcher<GetTmpTmpApiResult>(`${process.env.API_BASE_URL}/api/tmp`)

  const renderBody = () => {
    if (tmpDataState.isLoading) {
      return <p>Loading...</p>
    } else if (tmpDataState.error) {
      return <p>ERROR: {tmpDataState.error.message}</p>
    } else if (tmpDataState.data.tmptmp.length === 0) {
      return <p>No results</p>
    }
    return (
      <ol>
        {tmpDataState.data.tmptmp.map(t => (
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
