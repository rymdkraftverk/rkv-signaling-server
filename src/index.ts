import * as ws from './ws'
import * as http from './http'
import gameCode from './gameCode'

const PORT = Number(process.env.PORT) || 3000
const VERSION = process.env.VERSION || 'N/A'

console.log(`Version: ${VERSION}`)

const httpServer = http.init(PORT)
ws.init(httpServer, gameCode.delete)

console.log(`[HTTP/WS] Listening on port ${PORT}`)

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION')
  console.error(err)
})
