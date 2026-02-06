import { NodeApp } from 'astro/app/node';
import * as options from 'virtual:astro-node:config';
import { manifest } from 'astro:ssr-manifest';
import { createStandaloneHandler } from '../handlers.js';

async function start() {
	const { logListeningOn } = await import('../../log-listening-on.js');
	const { createServer, hostOptions } = await import('../server.js');
	const { setGetEnv } = await import('astro/env/setup');

	setGetEnv((key) => process.env[key]);

	const app = new NodeApp(manifest, !options.experimentalDisableStreaming);

	const port = process.env.PORT ? Number(process.env.PORT) : options.port;
	const host = process.env.HOST ?? hostOptions(options.host);

	const server = createServer(createStandaloneHandler({ app, ...options }));
	server.listen(port, host);
	if (process.env.ASTRO_NODE_LOGGING !== 'disabled') {
		logListeningOn(app.getAdapterLogger(), server, host);
	}
}

if (process.env.ASTRO_NODE_AUTOSTART !== 'disabled') {
	await start();
}

export let previewHandler!: ReturnType<typeof createStandaloneHandler>;

if (process.env.ASTRO_NODE_PREVIEW === 'true') {
	const app = new NodeApp(manifest, !options.experimentalDisableStreaming);
	previewHandler = createStandaloneHandler({ app, ...options });
}
