// @ts-check
import { NodeApp } from 'astro/app/node';
import * as options from 'virtual:astro-node:config';
import { manifest } from 'virtual:astro:manifest';
import { setGetEnv } from 'astro/env/setup';
import { startServer as _startServer } from '../../dist/create-server.js';

setGetEnv((key) => process.env[key]);

const app = new NodeApp(manifest, !options.experimentalDisableStreaming);

export function startServer() {
	const server = _startServer(app, options);
	return {
		...server,
		stop() {
			return new Promise((resolve, reject) => {
				server.server.destroy((err) => (err ? reject(err) : resolve(undefined)));
			});
		},
	};
}
