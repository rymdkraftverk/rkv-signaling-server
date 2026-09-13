const parseCsv = (x: string) => x.split(',')

const whitelist = Deno.env.get('CORS_WHITELIST')

const config = {
  corsWhitelist: whitelist ? parseCsv(whitelist) : ['http://localhost:8081'],
}

export default config
