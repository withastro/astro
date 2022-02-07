import type { SSRManifest, SerializedSSRManifest } from './types';

import * as fs from 'fs';
import { App } from './index.js';
import { deserializeManifest } from './common.js';


export async function loadManifest(rootFolder: URL): Promise<SSRManifest> {
	const manifestFile = new URL('./manifest.json', rootFolder);
	const rawManifest = await fs.promises.readFile(manifestFile, 'utf-8');
	const serializedManifest: SerializedSSRManifest = JSON.parse(rawManifest);
	return deserializeManifest(serializedManifest);
}

export async function loadApp(rootFolder: URL): Promise<App> {
	const manifest = await loadManifest(rootFolder);
	return new App(manifest, rootFolder);
}
