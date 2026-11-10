import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { loadFixture } from './test-utils.ts';

const root = new URL('./fixtures/ssr-assets/', import.meta.url);

describe('Build: .vite folder cleanup', () => {
	it('keeps build.license output in a static build', async () => {
		const fixture = await loadFixture({
			root: './fixtures/ssr-assets/',
			outDir: './dist/vite-cleanup-static/',
			cacheDir: './node_modules/.astro-test/vite-cleanup-static/',
			vite: { build: { license: true } },
		});
		await fixture.build();

		const outDir = new URL('./dist/vite-cleanup-static/', root);
		assert.equal(existsSync(new URL('.vite/license.md', outDir)), true);
	});

	it('keeps build.license output and removes the Astro manifest in a server build', async () => {
		const fixture = await loadFixture({
			root: './fixtures/ssr-assets/',
			output: 'server',
			adapter: testAdapter(),
			outDir: './dist/vite-cleanup-server/',
			cacheDir: './node_modules/.astro-test/vite-cleanup-server/',
			vite: { build: { license: true } },
		});
		await fixture.build();

		const outDir = new URL('./dist/vite-cleanup-server/', root);
		assert.equal(existsSync(new URL('client/.vite/license.md', outDir)), true);
		assert.equal(existsSync(new URL('server/.vite/license.md', outDir)), true);
		assert.equal(existsSync(new URL('server/.vite/manifest.json', outDir)), false);
	});

	// Astro overrides the top-level `vite.build.manifest`, so the client manifest is enabled
	// through a plugin, the way an integration would.
	it('keeps a client manifest requested by the user', async () => {
		const fixture = await loadFixture({
			root: './fixtures/ssr-assets/',
			output: 'server',
			adapter: testAdapter(),
			outDir: './dist/vite-cleanup-client-manifest/',
			cacheDir: './node_modules/.astro-test/vite-cleanup-client-manifest/',
			vite: {
				plugins: [
					{
						name: 'test:client-manifest',
						configEnvironment(name) {
							if (name === 'client') return { build: { manifest: true } };
						},
					},
				],
			},
		});
		await fixture.build();

		const outDir = new URL('./dist/vite-cleanup-client-manifest/', root);
		assert.equal(existsSync(new URL('client/.vite/manifest.json', outDir)), true);
	});
});
