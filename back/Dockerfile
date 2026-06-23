FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

RUN chmod +x ./docker-entrypoint.sh

RUN mkdir -p /data

ENV NODE_ENV=production

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"]