FROM node:24-slim

RUN npm install -g pnpm

WORKDIR /work

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .

EXPOSE 4321
