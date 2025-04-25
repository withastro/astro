import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';
import assert from 'node:assert/strict';
import * as cheerio from 'cheerio';

describe('CSP', () => {
	let app;
	/**
	 * @type {import('../dist/core/build/types.js').SSGManifest}
	 */
	let manifest;
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
			adapter: testAdapter({
				setManifest(_manifest) {
					manifest = _manifest;
				},
			}),
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('should contain the meta style hashes when CSS is imported from Astro component', async () => {
		if (manifest) {
			const request = new Request('http://example.com/index.html');
			const response = await app.render(request);
			const $ = cheerio.load(await response.text());

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			for (const hash of manifest.clientStyleHashes) {
				assert.match(
					meta.attr('content'),
					new RegExp(`'sha256-${hash}'`),
					`Should have a CSP meta tag for ${hash}`,
				);
			}

			let astroStyleHash = manifest.astroIslandHashes.find(
				({ name }) => name === 'astro-island-styles',
			);
			astroStyleHash = `sha256-${astroStyleHash.hash}`;

			let astroIsland = manifest.astroIslandHashes.find(({ name }) => name === 'astro-island');
			astroIsland = `sha256-${astroIsland.hash}`;

			assert.ok(
				meta.attr('content').includes(astroStyleHash),
				`Should have a CSP meta tag for ${astroStyleHash}`,
			);

			assert.ok(
				meta.attr('content').includes(astroIsland),
				`Should have a CSP meta tag for ${astroIsland}`,
			);
		} else {
			assert.fail('Should have the manifest');
		}
	});
});
