import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { removeViteManifestDirectories } from '../../../dist/core/build/vite-plugin-ssr-assets.js';
import { createFixture } from '../test-utils.ts';

describe('removeViteManifestDirectories', () => {
	it('removes the .vite folder when it only contains the manifest', async () => {
		const fixture = await createFixture({
			'dist/.vite/manifest.json': '{}',
		});
		const outDir = pathToFileURL(`${fixture.path}/dist/`);

		await removeViteManifestDirectories([outDir]);

		assert.equal(existsSync(new URL('.vite/', outDir)), false);
	});

	it('keeps other files in the .vite folder, such as build.license output', async () => {
		const fixture = await createFixture({
			'dist/server/.vite/manifest.json': '{}',
			'dist/server/.vite/license.md': '# Licenses',
			'dist/client/.vite/license.md': '# Licenses',
		});
		const serverDir = pathToFileURL(`${fixture.path}/dist/server/`);
		const clientDir = pathToFileURL(`${fixture.path}/dist/client/`);

		await removeViteManifestDirectories([serverDir, clientDir]);

		assert.equal(existsSync(new URL('.vite/manifest.json', serverDir)), false);
		assert.equal(existsSync(new URL('.vite/license.md', serverDir)), true);
		assert.equal(existsSync(new URL('.vite/license.md', clientDir)), true);
	});

	it('ignores directories without a .vite folder', async () => {
		const fixture = await createFixture({ 'dist/index.html': '' });
		const outDir = pathToFileURL(`${fixture.path}/dist/`);

		await removeViteManifestDirectories([outDir]);

		assert.equal(existsSync(new URL('index.html', outDir)), true);
	});
});
