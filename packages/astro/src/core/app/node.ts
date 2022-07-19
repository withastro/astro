import type { SerializedSSRManifest, SSRManifest } from './types';

import * as fs from 'fs';
import { IncomingMessage } from 'http';
import { deserializeManifest } from './common.js';
import { App } from './index.js';

const clientAddressSymbol = Symbol.for('astro.clientAddress');

function createRequestFromNodeRequest(req: IncomingMessage): Request {
	let url = `http://${req.headers.host}${req.url}`;
	let rawHeaders = req.headers as Record<string, any>;
	const entries = Object.entries(rawHeaders);
	let request = new Request(url, {
		method: req.method || 'GET',
		headers: new Headers(entries),
	});
	if(req.socket.remoteAddress) {
		Reflect.set(request, clientAddressSymbol, req.socket.remoteAddress);
	}
	return request;
}

export class NodeApp extends App {
	match(req: IncomingMessage | Request) {
		return super.match(req instanceof Request ? req : createRequestFromNodeRequest(req));
	}
	render(req: IncomingMessage | Request) {
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
