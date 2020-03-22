import { createServer } from 'http';
import socketIO from 'socket.io';
import { getRawClient } from '../db';
import { GameChangeV2Notification } from '../types/model';

const runServer = async () => {
  const server = createServer()

  const io = socketIO(server, {
    path: '/socket',
    serveClient: false,
    cookie: false,
  })

  // IMPORTANT: must initialize namsepaces on startup
  const gameIO = io.of('/game')

  const pgClient = await getRawClient()
  pgClient.query('LISTEN gameChange')
  pgClient.query('LISTEN gameChange_v2')
  pgClient.on('notification', msg => {
    try {
      switch (msg.channel) {
        case 'gamechange':
          const gameIDStr = msg.payload!
          gameIO.emit(`gameChange:${gameIDStr}`, 'UPDATE')
          break

        case 'gamechange_v2':
          const not: GameChangeV2Notification = JSON.parse(msg.payload as string)
          gameIO.emit(`gameChange_v2:${not.gameID}`, not)
          break

        default:
          console.warn('Unrecognized pg notification: ' + msg.channel)
          break
      }
    } catch (e) {
      console.error('Failed to handle message')
      console.dir(msg)
      console.error(e.stack)
    }
  })

  server.listen(3001)

  console.log('READY')
}

if (require.main === module) {
  runServer()
}
