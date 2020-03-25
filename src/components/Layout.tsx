import { FunctionComponent } from 'react'
import { ThemeContextProvider } from '../components/ThemeContext'
import Head from 'next/head';

const [FONT_SIZE, FONT, FONT_URL] = ['15px', `'IBM Plex Sans', sans-serif`, 'https://fonts.googleapis.com/css?family=IBM+Plex+Sans&display=swap']

export const Layout: FunctionComponent = ({ children }) => (
  <ThemeContextProvider>
    <Head key="layout">
      <title>Codenames with friends</title>
      <link rel="stylesheet" href={FONT_URL} />
    </Head>
    <div className='container'>
      {children}
      <style jsx>
        {`
          .container {
            width: 900px;
            margin: 0 auto;
          }
        `}
      </style>
      <style jsx global>
        {`
          body {
            padding: 0;
            margin: 0;
            font-family: ${FONT};
            font-size: ${FONT_SIZE};
          }
          body * {
            box-sizing: border-box;
          }

          .clickable {
            cursor: pointer;
          }

          .input-error {
            display: block;
            margin-top: 5px;
            margin-bottom: 5px;
            color: red;
            font-weight: normal;
          }

          .pre-deal-in {
            transform: translate(-1000px, -1000px);
          }

          .post-deal-in {
            animation: dealIn 0.2s;
          }

          @keyframes dealIn {
            0% {
              transform: translate(-1000px, -100px);
            }
            100% {
              transform: translate(0, 0);
            }
          }
        `}
      </style>
    </div>
  </ThemeContextProvider>
)
