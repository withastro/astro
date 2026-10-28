// Development: Vite compiles the app and its Astro components on request, and serves the client
// modules of the islands.
import { getRequestListener } from '@hono/node-server';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const listener = getRequestListener(async (request) => {
	const { default: app } = await vite.ssrLoadModule('/src/app.ts');
	return app.fetch(request);
});

const { createServer: createHttpServer } = await import('node:http');
const port = Number(process.env.PORT ?? 3000);
createHttpServer((req, res) => vite.middlewares(req, res, () => listener(req, res))).listen(
	port,
	() => console.log(`http://localhost:${port}/`),
);
