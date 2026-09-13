# rkv-signaling-server

The broker the games and controllers meet at. It hands out game codes over HTTP
and relays the WebRTC handshake over WebSocket, then steps aside.

Runs on Deno.

```
deno task dev     # serve on :3000 with reload
deno task qa      # test, lint, format check, type check
deno task start   # what the container runs
```

Environment: `PORT`, `CORS_WHITELIST` (comma separated origins the games are
served from), `SLACK_WEBHOOK_URL` for score boards, `GAME_CODE` to pin every
game to one code for demos, `VERSION` for the startup log.

The shared protocol pieces come straight from the `rkv-signaling` source at a
pinned commit, see `deno.json`.
