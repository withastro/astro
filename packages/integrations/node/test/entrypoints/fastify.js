// @ts-check
import Fastify from 'fastify';
import fastifyMiddie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import { nodeHandler } from '@astrojs/node/node-handler';

export async function startServer() {
	const app = Fastify({ logger: false });
	await app
		.register(fastifyStatic, {
			root: new URL('./dist/client', import.meta.url),
		})
		.register(fastifyMiddie);
	app.use(nodeHandler);

	await app.listen({ port: 8889 });

	return app;
}
