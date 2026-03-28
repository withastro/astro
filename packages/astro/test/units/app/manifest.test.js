import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { deserializeManifest } from '../../../dist/core/app/manifest.js';
import { createKey, encodeKey } from '../../../dist/core/encryption.js';
import { createManifest } from './test-helpers.js';

async function createSerializedManifest(overrides = {}) {
	const manifest = createManifest();

	return /** @type {import('../../../dist/core/app/types.js').SerializedSSRManifest} */ ({
		...manifest,
		rootDir: 'C:\\astro-test\\',
		srcDir: 'C:\\astro-test\\src\\',
		cacheDir: 'C:\\astro-test\\.astro\\',
		outDir: 'C:\\astro-test\\dist\\',
		publicDir: 'C:\\astro-test\\public\\',
		buildClientDir: 'C:\\astro-test\\dist\\client\\',
		buildServerDir: 'C:\\astro-test\\dist\\server\\',
		routes: [],
		assets: [],
		componentMetadata: [],
		inlinedScripts: [],
		clientDirectives: [],
		key: await encodeKey(await createKey()),
		...overrides,
	});
}

describe('deserializeManifest', () => {
	it('deserializes Windows directory strings into file URLs', async () => {
		const manifest = deserializeManifest(await createSerializedManifest());

		assert.equal(manifest.rootDir.href, pathToFileURL('C:\\astro-test\\', { windows: true }).href);
		assert.equal(
			manifest.srcDir.href,
			pathToFileURL('C:\\astro-test\\src\\', { windows: true }).href,
		);
		assert.equal(
			new URL('pages/index.astro', manifest.srcDir).href,
			pathToFileURL('C:\\astro-test\\src\\pages\\index.astro', { windows: true }).href,
		);
	});
});
