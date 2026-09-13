import config from './config.ts'
import gameCode from './gameCode.ts'
import { postScoreBoard } from './slack.ts'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const corsHeaders = (request: Request) => {
  const origin = request.headers.get('origin')
  const headers = new Headers({ Vary: 'Origin' })

  if (origin && config.corsWhitelist.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Methods', 'GET,POST')
    headers.set('Access-Control-Allow-Headers', 'Content-Type')
  }

  return headers
}

const withCors = (request: Request, response: Response) => {
  corsHeaders(request).forEach((value, key) => {
    response.headers.set(key, value)
  })
  return response
}

const route = async (request: Request) => {
  const { pathname } = new URL(request.url)
  const key = `${request.method} ${pathname}`

  switch (key) {
    case 'POST /game': {
      const code = await gameCode.create()
      console.log(`[Game created] ${code}`)
      return json({ gameCode: code })
    }
    case 'POST /scoreBoard':
      await postScoreBoard(await request.json())
      return new Response(null, { status: 200 })
    case 'GET /status':
      return json({ status: 'ok' })
    default:
      return new Response(null, { status: 404 })
  }
}

export const handle = (request: Request) => {
  if (request.method === 'OPTIONS') {
    return withCors(request, new Response(null, { status: 204 }))
  }

  return route(request)
    .catch((error) => {
      console.error(error)
      return new Response(null, { status: 500 })
    })
    .then((response) => withCors(request, response))
}
