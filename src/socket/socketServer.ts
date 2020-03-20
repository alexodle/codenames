import { createServer } from 'http';
import socketIO from 'socket.io';
import { getRawClient } from '../db';

const runServer = async () => {
  const server = createServer()

  const io = socketIO(server, {
    path: '/socket',
    serveClient: false,
    cookie: false,
  })

  const pgClient = await getRawClient()
  pgClient.query('LISTEN gameChange')
  pgClient.on('notification', msg => {
    const gameID = parseInt(msg.payload as string, 10)
    io.of(`/game/${gameID}`).emit('gameChange', 'hihi')
  })

  server.listen(3001)
}

if (require.main === module) {
  runServer()
}
