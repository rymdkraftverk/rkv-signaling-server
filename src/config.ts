const { env } = process

const parseCsv = (x: string) => x.split(',')

const config = {
  corsWhitelist: env.CORS_WHITELIST
    ? parseCsv(env.CORS_WHITELIST)
    : ['http://localhost:8081'],
}

export default config
