import Head from 'next/head';
import { FunctionComponent, useEffect, useState } from 'react';
import { ThemeContextProvider } from '../components/ThemeContext';
import { Player } from '../types/model';
import Link from "next/link";
import { PAGE_TITLE } from '../util/constants';

// const [FONT_SIZE, FONT, FONT_URL] = ['15px', `'IBM Plex Sans', sans-serif`, 'https://fonts.googleapis.com/css?family=IBM+Plex+Sans&display=swap']
const [FONT_SIZE, FONT, FONT_URL] = ['15px', 'Verdana, Geneva, sans-serif', undefined]

const Logo: FunctionComponent = () => (
  <div>
    <Link href="/">
      <a>
        <img src='/agent.png' width='60px' height='60px' alt='logo' />
        <h1>Codenames with friends</h1>
      </a>
    </Link>
    <style jsx>
      {`
        a, a:visited {
          text-decoration: none;
          color: inherit;
        }
        h1 {
          display: inline-block;
          font-size: 250%;
        }
        img {
          position: relative;
          display: inline-block;
          top: 14px;
        }
      `}
    </style>
  </div>
)

export interface LayoutProps {
  myPlayer?: Player
}
export const Layout: FunctionComponent<LayoutProps> = ({ children, myPlayer }) => {
  // update login url with redirect once we're in the browser (as opposed to SSR)
  const [loginURL, setLoginURL] = useState('/api/auth/login')
  useEffect(() => {
    setLoginURL(`/api/auth/login?redirect=${encodeURIComponent(window.location.href)}`)
  }, [])

  return (
    <ThemeContextProvider>
      <Head key="layout">
        <title>{PAGE_TITLE}</title>
        {FONT_URL ? <link rel="stylesheet" href={FONT_URL} /> : undefined}
      </Head>
      <div className='container'>
        <header>
          <div className='logo-view'><Logo /></div>
          {myPlayer ? (
            <div className='player-view logged-in'>
              <b>{myPlayer.name}</b> | <a href='/api/auth/logout'>Log out</a>
            </div>
          ) : undefined}
          {!myPlayer ? (
            <div className='player-view logged-out'>
              <a href={loginURL}>Log in</a>
            </div>
          ) : undefined}
        </header>
        <div className='page-content'>
          {children}
        </div>
        <style jsx>
          {`
            .container {
              width: 900px;
              margin: 0 auto;
              position: relative;
            }

            header {
              position: relative;
              border-bottom: 1px solid gray;
              margin-bottom: 30px;
              padding-bottom: 0;
            }

            .player-view {
              position: absolute;
              right: 10px;
              bottom: 21px;
              text-align: right;
            }
            .player-view.logged-out {
              font-size: 140%;
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

            h1, h2, h3, h4, h5 {
              font-variant: normal;
              font-weight: 400;
              margin: 0;
              padding: 0;
              margin-bottom: 15px;
              margin-top: 30px;
            }

            h1:first-child, h2:first-child, h3:first-child, h4:first-child, h5:first-child {
              margin-top: 0;
            }

            hr {
              padding: 0;
              margin-top: 30px;
              margin-bottom: 10px;
              border: 0.5px solid gray;
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
    </ThemeContextProvider >
  )
}
