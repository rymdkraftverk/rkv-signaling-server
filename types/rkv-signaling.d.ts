declare module 'rkv-signaling' {
  export const common: {
    warnNotFound: (targetName: string) => (targetId: string) => void
    wsSend: (ws: { send: (data: string) => void }) => (event: string, payload: unknown) => void
    onWsMessage: <T>(
      eventMap: Record<string, (payload: T) => void>,
    ) => (message: string) => void
    prettyId: (id: string) => string
  }

  export const Event: {
    ANSWER: string
    RECEIVER_UPGRADE: string
    OFFER: string
    NOT_FOUND: string
    CLIENT_ID: string
  }
}
