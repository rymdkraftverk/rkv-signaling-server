const CODE_LENGTH = 4
const MAX_ATTEMPTS = 10
const CODE_LIFETIME_MS = 24 * 60 * 60 * 1000

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// Inspired by, but then mostly ignored:
// https://www.ismp.org/resources/misidentification-alphanumeric-symbols
const blacklistedLetters = [
  'I', // To avoid "Is this uppercase i or lowercase l?!"
  'G', // Sometimes confused with C at at quick glance
]

const validChars = alphabet.filter(c => !blacklistedLetters.includes(c))

const sample = (chars: string[]) => chars[Math.floor(Math.random() * chars.length)]

const randomizeCode = () => Array
  .from({ length: CODE_LENGTH }, () => sample(validChars))
  .join('')

const gameCodeLog = (message: string) => {
  console.log(`[Game code] ${message}`)
}

export interface GameCodeInterface {
  create: () => Promise<string>;
  delete: (code: string) => Promise<unknown>;
}

// Codes only need to be unique among the games this process is brokering.
// Everything else it tracks lives in memory too, and a restart drops every
// socket, so there is no older claimant to collide with.
export const createGameCodes = (): GameCodeInterface => {
  const taken = new Map<string, number>()

  const isTaken = (code: string) => {
    const expiresAt = taken.get(code)

    if (expiresAt === undefined) return false

    // Expire codes to prevent leakage from games that never disconnected cleanly
    if (expiresAt <= Date.now()) {
      taken.delete(code)
      return false
    }

    return true
  }

  return {
    create: async () => {
      const code = Array
        .from({ length: MAX_ATTEMPTS }, randomizeCode)
        .find(candidate => !isTaken(candidate))

      if (!code) {
        throw new Error(`Failed to find a unique code in ${MAX_ATTEMPTS} attempts`)
      }

      taken.set(code, Date.now() + CODE_LIFETIME_MS)
      return code
    },
    delete: async (code) => {
      taken.delete(code)
      return code
    },
  }
}

const createInMemoryInterface = (): GameCodeInterface => {
  gameCodeLog('Tracking codes in memory')
  return createGameCodes()
}

const createEnvInterface = (gameCode: string): GameCodeInterface => {
  const code = gameCode.toUpperCase()
  gameCodeLog(`Game code overriden for demo purposes: "${code}"`)
  return {
    create: () => Promise.resolve(code),
    delete: () => Promise.resolve('N/A'),
  }
}

const getInterface = (): GameCodeInterface => {
  const { GAME_CODE } = process.env

  if (GAME_CODE) return createEnvInterface(GAME_CODE)
  return createInMemoryInterface()
}

export default getInterface()
