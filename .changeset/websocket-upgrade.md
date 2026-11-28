---
'astro': minor
'@astrojs/runtime': minor
'@astrojs/node': minor
---

Adds experimental support for WebSocket connections in on-demand endpoints

Enable the `experimental.websocket` flag to accept WebSocket connections through `context.websocket`. The upgrade request runs through middleware like any other request, so you can read `locals`, cookies and sessions before deciding whether to accept the connection:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  experimental: {
    websocket: true,
  },
});
```

```ts
// src/pages/api/chat.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ websocket, locals }) => {
  if (!websocket?.isUpgradeRequest()) {
    return new Response('Expected a WebSocket upgrade', { status: 426 });
  }
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { socket, response } = websocket.upgrade();
  socket.addEventListener('message', (event) => {
    socket.send(`${locals.user.name}: ${event.data}`);
  });
  return response;
};
```

Returning any response other than the one from `websocket.upgrade()` rejects the connection, and the client receives that response instead. Cookies set during the request are sent with the handshake.

Upgrade requests sent by a page on another site are rejected with a `403` before middleware runs, so other sites cannot open connections as your signed-in users.

`context.websocket` is `undefined` when the adapter cannot accept WebSocket connections. Adapters add support by passing an `upgradeWebSocket` function to `app.render()`.

#### `@astrojs/node`

The Node adapter accepts WebSocket connections in `standalone` mode and in `astro preview`. In `middleware` mode, attach the exported `upgradeHandler` to your own server:

```js
import http from 'node:http';
import express from 'express';
import { handler, upgradeHandler } from './dist/server/entry.mjs';

const app = express();
app.use(handler);

const server = http.createServer(app);
server.on('upgrade', upgradeHandler);
server.listen(8080);
```

Messages larger than 1 MiB close the connection. Use the `experimentalWebSocketMaxPayload` adapter option to change the limit. An error thrown by a socket listener closes that connection and is logged, without affecting other connections.
