import type { SSRManifest, SerializedSSRManifest } from './types';

import * as fs from 'fs';
import { App } from './index.js';
import { deserializeManifest } from './common.js';
import { IncomingMessage } from 'http';

function createURLFromRequest(req: IncomingMessage): URL {
	return new URL(`http://${req.headers.host}${req.url}`);
}

class NodeApp extends App {
	match(req: IncomingMessage | URL) {
		return super.match(req instanceof URL ? req : createURLFromRequest(req));
	}
	render(req: IncomingMessage | URL) {
		return super.render(req instanceof URL ? req : createURLFromRequest(req));
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
