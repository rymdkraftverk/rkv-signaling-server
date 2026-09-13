import {
  onWsMessage,
  prettyId,
  warnNotFound,
  wsSend,
} from 'rkv-signaling/common.ts'
import Event from 'rkv-signaling/event.ts'

const Type = {
  INITIATOR: 'initiator',
  RECEIVER: 'receiver',
} as const

type Client = {
  id: string
  socket: WebSocket
  type: typeof Type[keyof typeof Type]
  receiverId?: string
}

const clients: Client[] = []

const createClient = (socket: WebSocket) => {
  const client: Client = {
    id: crypto.randomUUID(),
    socket,
    type: Type.INITIATOR, // receiver clients get upgraded in onReceiverUpgrade
  }

  clients.push(client)
  return client
}

const removeClient = (id: string) => {
  const index = clients.findIndex((c) => c.id === id)
  if (index >= 0) {
    clients.splice(index, 1)
  }
}

const getClient = (id: string) => clients.find((x) => x.id === id)

const getReceiverClient = (receiverId: string) =>
  clients.find((x) =>
    x.type === Type.RECEIVER && x.receiverId === receiverId.toUpperCase()
  )

const prettyClient = (client: Client) =>
  `${client.type}(${prettyId(client.id)})`

const onReceiverUpgrade = (client: Client) => (receiverId: string) => {
  client.type = Type.RECEIVER
  client.receiverId = receiverId
  console.log(`[Receiver upgrade] ${prettyClient(client)}`)
}

const onOffer = (client: Client) =>
({ receiverId, channelInfos, offer }: {
  receiverId: string
  channelInfos: unknown
  offer: unknown
}) => {
  const receiver = getReceiverClient(receiverId)

  if (!receiver) {
    warnNotFound('receiver')(receiverId)
    wsSend(client.socket)(Event.NOT_FOUND, receiverId)
    return
  }

  console.log(`[Offer] ${prettyClient(client)} -> ${prettyClient(receiver)}`)

  wsSend(receiver.socket)(Event.OFFER, {
    channelInfos,
    initiatorId: client.id,
    offer,
  })
}

const onAnswer = (client: Client) =>
({ initiatorId, answer }: {
  initiatorId: string
  answer: unknown
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
) =>
() => {
  console.log(`[Client close] ${prettyClient(client)}`)
  removeClient(client.id)
  if (client.type === Type.RECEIVER && client.receiverId) {
    onReceiverDelete(client.receiverId)
  }
}

export const accept = (
  request: Request,
  onReceiverDelete: (receiverId: string) => unknown,
) => {
  const { socket, response } = Deno.upgradeWebSocket(request)

  socket.onopen = () => {
    const client = createClient(socket)
    console.log(`[Client connect] ${prettyClient(client)}`)
    wsSend(client.socket)(Event.CLIENT_ID, client.id)

    socket.onmessage = ({ data }) =>
      onWsMessage<never>({
        [Event.RECEIVER_UPGRADE]: onReceiverUpgrade(client),
        [Event.ANSWER]: onAnswer(client),
        [Event.OFFER]: onOffer(client),
      })(String(data))
    socket.onclose = onClose(client, onReceiverDelete)
  }

  return response
}
