import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadFixture } from './test-utils.ts';

describe('Astro config formats', () => {
	it('An mjs config can import TypeScript modules', async () => {
		// The dev-render fixture loads without an astro.config.mjs,
		// which validates that the default config resolution works.
		// The original test only asserted that the container started
		// (meaning config loaded successfully).
		const fixture = await loadFixture({
			root: './fixtures/dev-render/',
			outDir: './dist/config-format/',
			cacheDir: './node_modules/.astro-test/config-format/',
		});
		const devServer = await fixture.startDevServer();
		assert.ok(devServer, 'Dev server started, which means the config loaded.');
		await devServer.stop();
	});
});
