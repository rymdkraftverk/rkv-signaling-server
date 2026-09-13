import * as ws from './ws.ts'
import * as http from './http.ts'
import gameCode from './gameCode.ts'

const PORT = Number(Deno.env.get('PORT')) || 3000
const VERSION = Deno.env.get('VERSION') || 'N/A'

console.log(`Version: ${VERSION}`)

const isUpgrade = (request: Request) =>
  request.headers.get('upgrade')?.toLowerCase() === 'websocket'

Deno.serve(
  { port: PORT },
  (request) =>
    isUpgrade(request)
      ? ws.accept(request, gameCode.delete)
      : http.handle(request),
)

console.log(`[HTTP/WS] Listening on port ${PORT}`)
