import { createServer } from 'node:http'
import express from 'express'
import cors from 'cors'

import config from './config'
import gameCode from './gameCode'
import { postScoreBoard } from './slack'

const addGameEndpoint = (app: express.Express) => {
  app.post('/game', (_req, res) => {
    gameCode.create()
      .then((code) => {
        res.json({ gameCode: code })
        console.log(`[Game created] ${code}`)
      })
      .catch(console.error)
  })
}

const addScoreBoardEndpoint = (app: express.Express) => {
  app.post('/scoreBoard', (req, res) => {
    postScoreBoard(req.body)
      .then(() => {
        res.sendStatus(200)
      })
      .catch(console.error)
  })
}

const addStatusEndpoint = (app: express.Express) => {
  app.get('/status', (_req, res) => {
    res.json({
      status: 'ok',
    })
  })
}

export const init = (port: number) => {
  const app = express()
  app.use(express.json())
  app.use(cors({
    origin: config.corsWhitelist,
  }))

  addGameEndpoint(app)
  addScoreBoardEndpoint(app)
  addStatusEndpoint(app)

  const httpServer = createServer(app)
  httpServer.listen(port)
  return httpServer
}
