import { NodeApp } from 'astro/app/node';
import { setGetEnv } from 'astro/env/setup';
import * as options from 'virtual:astro-node:config';
import { manifest } from 'virtual:astro:manifest';
import { createServer, createStandaloneHandler, startServer } from '../create-server.js';
import { logListeningOn } from '../log-listening-on.js';
import { LOGGING_KEY } from '../shared.js';
import type { CreateNodePreviewServer } from '../types.js';
import { isPreview } from './utils.js';

setGetEnv((key) => process.env[key]);

const app = new NodeApp(manifest, !options.experimentalDisableStreaming);

if (!isPreview()) {
	startServer(app, options);
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
