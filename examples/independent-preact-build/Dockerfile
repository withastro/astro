FROM node:20-alpine3.18 AS base
WORKDIR /app

COPY package.json ./
COPY dist ./dist

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD node ./dist/server/entry.mjs
