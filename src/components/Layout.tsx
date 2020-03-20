import { FunctionComponent } from 'react'

export const Layout: FunctionComponent = ({ children }) => (
  <div className='container'>
    {children}
    <style jsx>{`
    .container {
      width: 900px;
      margin: 0 auto;
    }
    `}</style>
    <style jsx global>{`
    body {
      padding: 0;
      margin: 0;
    }
    body * {
      box-sizing: border-box;
    }
    `}</style>
  </div>
)
