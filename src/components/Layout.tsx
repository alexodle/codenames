import { FunctionComponent } from 'react'
import { ThemeContextProvider } from '../components/ThemeContext'
import Head from 'next/head';

const [FONT_SIZE, FONT, FONT_URL] = ['15px', `'IBM Plex Sans', sans-serif`, 'https://fonts.googleapis.com/css?family=IBM+Plex+Sans&display=swap']

export const Layout: FunctionComponent = ({ children }) => (
  <ThemeContextProvider>
    <Head key="layout">
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

          input, select {
            font-size: 130%;
            border: 1px solid gray;
            border-radius: 5px;
            width: 100%;
            padding: 10px;
            margin-top: 10px;
            outline: none;
          }
          input.error {
            border: 1px solid red;
          }
          .input-error {
            display: block;
            margin-top: 5px;
            margin-bottom: 5px;
            color: red;
            font-weight: normal;
          }

          label {
            display: block;
            margin-bottom: 20px;
            margin-top: 20px;
            font-weight: bold;
            font-size: 120%;
          }
        `}
      </style>
    </div>
  </ThemeContextProvider>
)
