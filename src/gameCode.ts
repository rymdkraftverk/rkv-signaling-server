import redis from 'redis'

const CODE_LENGTH = 4
const MAX_ATTEMPTS = 10

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

const logRedisError = (message: unknown) => {
  console.error(`[Redis error] ${message}`)
}

const gameCodeLog = (message: string) => {
  console.log(`[Game code] ${message}`)
}

type SetKey = (
  key: string,
  value: string,
  mode: string,
  duration: number,
) => Promise<unknown>

type ExistsKey = (key: string) => Promise<boolean>

export interface GameCodeInterface {
  create: () => Promise<string>;
  delete: (code: string) => Promise<unknown>;
}

const createUniqueRandomCode = (
  set: SetKey,
  exists: ExistsKey,
  attempts: number,
): Promise<string> => {
  if (attempts > MAX_ATTEMPTS) {
    return Promise.reject(new Error(`Failed to find a unique code in ${MAX_ATTEMPTS} attempts`))
  }
  const candidateCode = randomizeCode()

  return exists(candidateCode)
    .then(doesExist => (
      doesExist
        ? createUniqueRandomCode(set, exists, attempts + 1)
        // Expire key after 24h to prevent leakage
        : set(candidateCode, candidateCode, 'EX', 86400)
          .then(() => candidateCode)
    ))
}

const createRedisInterface = (url: string): GameCodeInterface => {
  const client = redis.createClient({ url })
  client.on('error', logRedisError)

  const setKey: SetKey = (key, value, mode, duration) => new Promise((resolve, reject) => {
    client.set(key, value, mode, duration, (err, reply) => (
      err ? reject(err) : resolve(reply)
    ))
  })

  const existsKey: ExistsKey = key => new Promise((resolve, reject) => {
    client.exists(key, (err, reply) => (
      err ? reject(err) : resolve(Boolean(reply))
    ))
  })

  const deleteKey = (key: string) => new Promise((resolve, reject) => {
    client.del(key, (err, reply) => (
      err ? reject(err) : resolve(reply)
    ))
  })

  gameCodeLog('Powered by redis')
  return {
    create: () => createUniqueRandomCode(setKey, existsKey, 0),
    delete: deleteKey,
  }
}

const createInMemoryInterface = (): GameCodeInterface => {
  gameCodeLog('Resorting to in memory-tracking. Uniqueness is not guaranteed')
  return {
    create: () => Promise.resolve(randomizeCode()),
    delete: () => Promise.resolve('N/A'),
  }
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
  const { GAME_CODE, REDIS_URL } = process.env

  if (GAME_CODE) return createEnvInterface(GAME_CODE)
  if (REDIS_URL) return createRedisInterface(REDIS_URL)
  return createInMemoryInterface()
}

export default getInterface()
