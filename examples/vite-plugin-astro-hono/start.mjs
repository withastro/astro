// Production: the built app, with the client assets of the islands served from `dist/client/`.
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import app from './dist/server/app.js';

const server = new Hono();
server.use('/assets/*', serveStatic({ root: './dist/client' }));
server.route('/', app);

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: server.fetch, port }, () => console.log(`http://localhost:${port}/`));
