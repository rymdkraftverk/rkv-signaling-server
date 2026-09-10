FROM node:16.7

WORKDIR /app

COPY --chown=node:node package.json package-lock.json ./

RUN npm ci --production

COPY --chown=node:node src ./src

USER node

EXPOSE 3000

CMD ["npm", "start"]
