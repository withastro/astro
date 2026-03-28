import * as assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createKey, encodeKey } from '../../../dist/core/encryption.js';
import { deserializeManifest } from '../../../dist/core/app/manifest.js';
import { createManifest } from './test-helpers.js';

function toSerializedDirectoryPath(...segments) {
	if (process.platform === 'win32') {
		return `C:/astro-test/${segments.join('/')}${segments.length ? '/' : ''}`;
	}

	return `/astro-test/${segments.join('/')}${segments.length ? '/' : ''}`;
}

describe('deserializeManifest', () => {
	it('normalizes absolute filesystem directory strings to file URLs', async () => {
		const key = await encodeKey(await createKey());
		const serializedManifest = {
			...createManifest(),
			rootDir: toSerializedDirectoryPath(),
			srcDir: toSerializedDirectoryPath('src'),
			publicDir: toSerializedDirectoryPath('public'),
			outDir: toSerializedDirectoryPath('dist'),
			cacheDir: toSerializedDirectoryPath('.astro'),
			buildClientDir: toSerializedDirectoryPath('dist', 'client'),
			buildServerDir: toSerializedDirectoryPath('dist', 'server'),
			assets: [],
			componentMetadata: [],
			inlinedScripts: [],
			clientDirectives: [],
			routes: [],
			key,
		};

		const manifest = deserializeManifest(serializedManifest);

		assert.equal(path.normalize(fileURLToPath(manifest.rootDir)), path.normalize(toSerializedDirectoryPath()));
		assert.equal(path.normalize(fileURLToPath(manifest.srcDir)), path.normalize(toSerializedDirectoryPath('src')));
		assert.equal(
			path.normalize(fileURLToPath(manifest.publicDir)),
			path.normalize(toSerializedDirectoryPath('public')),
		);
		assert.equal(path.normalize(fileURLToPath(manifest.outDir)), path.normalize(toSerializedDirectoryPath('dist')));
		assert.equal(
			path.normalize(fileURLToPath(manifest.cacheDir)),
			path.normalize(toSerializedDirectoryPath('.astro')),
		);
		assert.equal(
			path.normalize(fileURLToPath(manifest.buildClientDir)),
			path.normalize(toSerializedDirectoryPath('dist', 'client')),
		);
		assert.equal(
			path.normalize(fileURLToPath(manifest.buildServerDir)),
			path.normalize(toSerializedDirectoryPath('dist', 'server')),
		);
	});
});
