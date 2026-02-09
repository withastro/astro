import type { Config } from './vite-plugin-config.js';
import * as http from 'node:http';
import * as https from 'node:https';
import enableDestroy from 'server-destroy';
import * as fs from 'node:fs';
import type { PreviewServer } from 'astro';

// Used to get Host Value at Runtime
export function hostOptions(host: Config['host']): string {
	if (typeof host === 'boolean') {
		return host ? '0.0.0.0' : 'localhost';
	}
	return host;
}

// also used by preview entrypoint
export function createServer(listener: http.RequestListener, host: string, port: number) {
	let httpServer: http.Server | https.Server;

	if (process.env.SERVER_CERT_PATH && process.env.SERVER_KEY_PATH) {
		httpServer = https.createServer(
			{
				key: fs.readFileSync(process.env.SERVER_KEY_PATH),
				cert: fs.readFileSync(process.env.SERVER_CERT_PATH),
			},
			listener,
		);
	} else {
		httpServer = http.createServer(listener);
	}
	enableDestroy(httpServer);

	// Resolves once the server is closed
	const closed = new Promise<void>((resolve, reject) => {
		httpServer.addListener('close', resolve);
		httpServer.addListener('error', reject);
	});

	const previewable = {
		host,
		port,
		closed() {
			return closed;
		},
		async stop() {
			await new Promise((resolve, reject) => {
				httpServer.destroy((err) => (err ? reject(err) : resolve(undefined)));
			});
		},
	} satisfies PreviewServer;

	return {
		server: httpServer,
		...previewable,
	};
}
