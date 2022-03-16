import type { SSRManifest, SerializedSSRManifest } from './types';
import type { IncomingHttpHeaders } from 'http';

import * as fs from 'fs';
import { App } from './index.js';
import { deserializeManifest } from './common.js';
import { IncomingMessage } from 'http';

function createRequestFromNodeRequest(req: IncomingMessage): Request {
	let url = `http://${req.headers.host}${req.url}`;
	const entries = Object.entries(req.headers as Record<string, any>);
	let request = new Request(url, {
		method: req.method || 'GET',
		headers: new Headers(entries),
	});
	return request;
}

class NodeApp extends App {
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
	return new NodeApp(manifest, rootFolder);
}
