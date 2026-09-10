FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.json tsconfig.build.json ./
RUN npm ci

COPY src ./src
COPY types ./types
RUN npm run build

FROM node:22-slim

WORKDIR /app

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=node:node --from=build /app/dist ./dist

USER node

EXPOSE 3000

CMD ["npm", "start"]
