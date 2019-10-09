const { env } = process

const parseCsv = x => x.split(',')

const config = {
  corsWhitelist: env.CORS_WHITELIST
    ? parseCsv(env.CORS_WHITELIST) :
    ['http://localhost:8081'],
}

module.exports = config
