FROM node:16.7

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm ci --production

COPY src ./src

EXPOSE 3000

CMD ["npm", "start"]
