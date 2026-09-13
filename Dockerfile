FROM denoland/deno:2.9.6

WORKDIR /app

COPY --chown=deno:deno deno.json deno.lock ./
COPY --chown=deno:deno src ./src
RUN deno install --entrypoint src/index.ts

USER deno

EXPOSE 3000

CMD ["deno", "task", "start"]
