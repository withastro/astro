import type { SSRManifest, SerializedSSRManifest } from './types';

import * as fs from 'fs';
import { BaseApp } from './index.js';
import { deserializeManifest } from './common.js';
import { IncomingMessage } from 'http';

function createURLFromRequest(req: IncomingMessage): URL {
	return new URL(`http://${req.headers.host}${req.url}`);
}

class NodeApp extends BaseApp {
	match(req: IncomingMessage) {
		return super.matchURL(createURLFromRequest(req));
	}
	render(req: IncomingMessage) {
		return super.renderURL(createURLFromRequest(req));
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
