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

    .clickable {
      cursor: pointer;
    }

    input, select, button {
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

    button {
      background-color: #D3D3D3;
    }
    button:enabled {
      cursor: pointer;
    }
    button:enabled:hover {
      background-color: #BEBEBE;
    }
    `}</style>
  </div>
)
