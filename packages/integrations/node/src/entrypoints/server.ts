import { NodeApp } from 'astro/app/node';
import * as options from 'virtual:astro-node:config';
import { manifest } from 'virtual:astro:manifest';
import type { NodeAppHeadersJson } from 'astro';
import { logListeningOn } from '../log-listening-on.js';
import { createServer, createStandaloneHandler, hostOptions } from '../create-server.js';
import { setGetEnv } from 'astro/env/setup';
import { LOGGING_KEY, readHeadersJson } from '../shared.js';
import { isPreview } from './utils.js';
import type { CreateNodePreviewServer } from '../types.js';

const app = new NodeApp(manifest, !options.experimentalDisableStreaming);

function startServer() {
	setGetEnv((key) => process.env[key]);

	let headersMap: NodeAppHeadersJson | undefined = undefined;
	if (options.staticHeaders) {
		headersMap = readHeadersJson(manifest.outDir);
	}

	if (headersMap) {
		app.setHeadersMap(headersMap);
	}

	const port = process.env.PORT ? Number(process.env.PORT) : options.port;
	const host = process.env.HOST ?? hostOptions(options.host);

	const server = createServer(createStandaloneHandler(app, options));
	server.listen(port, host);
	if (process.env[LOGGING_KEY] !== 'disabled') {
		logListeningOn(app.getAdapterLogger(), server, host);
	}
	return server;
}

if (!isPreview()) {
	startServer();
}

export const createNodePreviewServer: CreateNodePreviewServer = async ({
	host,
	port,
	logger,
	headers,
}) => {
	const server = createServer(createStandaloneHandler(app, options));

	// If user specified custom headers append a listener
	// to the server to add those headers to response
	if (headers) {
		server.addListener('request', (_, res) => {
			if (res.statusCode === 200) {
				for (const [name, value] of Object.entries(headers)) {
					if (value) res.setHeader(name, value);
				}
			}
		});
	}

	if (process.env[LOGGING_KEY] !== 'disabled') {
		logListeningOn(logger, server, host);
	}

	await new Promise<void>((resolve, reject) => {
		server.once('listening', resolve);
		server.once('error', reject);
		server.listen(port, host);
	});

	return {
		closed() {
			return new Promise<void>((resolve, reject) => {
				server.addListener('close', resolve);
				server.addListener('error', reject);
			});
		},
		stop() {
			return new Promise<void>((resolve, reject) => {
				server.destroy((err) => (err ? reject(err) : resolve()));
			});
		},
	};
};
