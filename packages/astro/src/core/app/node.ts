import type { SerializedSSRManifest, SSRManifest } from './types';

import * as fs from 'fs';
import { IncomingMessage } from 'http';
import { deserializeManifest } from './common.js';
import { App } from './index.js';

const clientAddressSymbol = Symbol.for('astro.clientAddress');

function createRequestFromNodeRequest(req: IncomingMessage, body?: string): Request {
	let url = `http://${req.headers.host}${req.url}`;
	let rawHeaders = req.headers as Record<string, any>;
	const entries = Object.entries(rawHeaders);
	let request = new Request(url, {
		method: req.method || 'GET',
		headers: new Headers(entries),
		body,
	});
	if (req.socket?.remoteAddress) {
		Reflect.set(request, clientAddressSymbol, req.socket.remoteAddress);
	}
	return request;
}

export class NodeApp extends App {
	match(req: IncomingMessage | Request) {
		return super.match(req instanceof Request ? req : createRequestFromNodeRequest(req));
	}
	render(req: IncomingMessage | Request) {
		if ('on' in req) {
			let body: string | undefined = undefined;
			let reqBodyComplete = new Promise((resolve, reject) => {
				req.on('data', (d) => {
					if (body === undefined) {
						body = '';
					}
					if (d instanceof Buffer) {
						body += d.toString('utf-8');
					} else if (typeof d === 'string') {
						body += d;
					}
				});
				req.on('end', () => {
					resolve(body);
				});
				req.on('error', (err) => {
					reject(err);
				});
			});

			return reqBodyComplete.then(() => {
				return super.render(req instanceof Request ? req : createRequestFromNodeRequest(req, body));
			});
		}
		return super.render(req instanceof Request ? req : createRequestFromNodeRequest(req));
	}
}

export async function loadManifest(rootFolder: URL): Promise<SSRManifest> {
	const manifestFile = new URL('./manifest.json', rootFolder);
	const rawManifest = await fs.promises.readFile(manifestFile, 'utf-8');
	const serializedManifest: SerializedSSRManifest = JSON.parse(rawManifest);
	return deserializeManifest(serializedManifest);
}

export async function loadApp(rootFolder: URL): Promise<NodeApp> {
	const manifest = await loadManifest(rootFolder);
	return new NodeApp(manifest);
}
