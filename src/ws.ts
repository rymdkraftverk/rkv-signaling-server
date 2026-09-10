import type { Server as HttpServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { WebSocketServer, type WebSocket } from 'ws'

import { common, Event } from 'rkv-signaling'

const {
  warnNotFound, wsSend, onWsMessage, prettyId,
} = common

const Type = {
  INITIATOR: 'initiator',
  RECEIVER:  'receiver',
} as const

interface Client {
  id:          string;
  socket:      WebSocket;
  type:        typeof Type[keyof typeof Type];
  receiverId?: string;
}

// state
let clients: Client[] = []
// end state

const createClient = (socket: WebSocket) => {
  const client: Client = {
    id:   randomUUID(),
    socket,
    type: Type.INITIATOR, // receiver clients get upgraded in onReceiverCreate
  }

  clients = clients.concat(client)
  return client
}

const removeClient = (id: string) => {
  clients = clients.filter(c => c.id !== id)
}

const getClient = (id: string) => clients.find(x => x.id === id)

const getReceiverClient = (receiverId: string) => clients.find(x => x.type === Type.RECEIVER
    && x.receiverId === receiverId.toUpperCase())

const prettyClient = (client: Client) => `${client.type}(${prettyId(client.id)})`

const pingMessage = (client: Client) => `[Ping] ${prettyId(client.id)}`

const onReceiverUpgrade = (client: Client) => (receiverId: string) => {
  client.type = Type.RECEIVER
  client.receiverId = receiverId
  console.log(`[Receiver upgrade] ${prettyClient(client)}`)
}

const onOffer = (client: Client) => ({ receiverId, channelInfos, offer }: {
  receiverId:   string;
  channelInfos: unknown;
  offer:        unknown;
}) => {
  const receiver = getReceiverClient(receiverId)

  if (!receiver) {
    warnNotFound('receiver')(receiverId)
    wsSend(client.socket)(Event.NOT_FOUND, receiverId)
    return
  }

  console.log(`[Offer] ${prettyClient(client)} -> ${prettyClient(receiver)}`)

  wsSend(receiver.socket)(
    Event.OFFER,
    {
      channelInfos,
      initiatorId: client.id,
      offer,
    },
  )
}

const onAnswer = (client: Client) => ({ initiatorId, answer }: {
  initiatorId: string;
  answer:      unknown;
}) => {
  const initiator = getClient(initiatorId)

  if (!initiator) {
    warnNotFound('initiator')(initiatorId)
    return
  }

  console.log(`[Answer] ${prettyClient(client)} -> ${prettyClient(initiator)}`)
  wsSend(initiator.socket)(Event.ANSWER, answer)
}

const onClose = (
  client: Client,
  onReceiverDelete: (receiverId: string) => unknown,
  keepAliveId: NodeJS.Timeout,
) => () => {
  console.log(`[Client close] ${prettyClient(client)}`)
  clearInterval(keepAliveId)
  removeClient(client.id)
  if (client.type === Type.RECEIVER && client.receiverId) {
    onReceiverDelete(client.receiverId)
  }
}

export const init = (
  httpServer: HttpServer,
  onReceiverDelete: (receiverId: string) => unknown,
) => {
  const server = new WebSocketServer({ server: httpServer })

  server.on('connection', (socket) => {
    const client = createClient(socket)
    console.log(`[Client connect] ${prettyClient(client)}`)
    wsSend(client.socket)(Event.CLIENT_ID, client.id)

    // Heroku times out all HTTP requests after 55 sec of inactivity
    // https://devcenter.heroku.com/articles/http-routing#timeouts
    const keepAliveId = setInterval(
      () => {
        socket.ping(pingMessage(client))
      },
      30000, // 30 sec
    )

    // Uncomment to debug ping/pong
    // socket.on('pong', data => console.log(data.toString()))

    socket.on('message', message => onWsMessage<never>({
      [Event.RECEIVER_UPGRADE]: onReceiverUpgrade(client),
      [Event.ANSWER]:           onAnswer(client),
      [Event.OFFER]:            onOffer(client),
    })(String(message)))
    socket.on('close', onClose(client, onReceiverDelete, keepAliveId))
  })
}
