import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('experimental.incrementalBuild server islands', () => {
	const root = new URL('./fixtures/incremental-build-islands/', import.meta.url);
	const cachedPlain = new URL('node_modules/.astro/dist/client/plain/a/index.html', root);
	const cachedIsland = new URL('node_modules/.astro/dist/client/island/a/index.html', root);
	let fixture: Fixture;

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
		fixture = await loadFixture({
			root,
			output: 'static',
			experimental: {
				incrementalBuild: true,
			},
		});
		// Warm the cache. Without ASTRO_KEY, each build mints a fresh key.
		await fixture.build({ adapter: testAdapter() });
	});

	it('busts server-island pages when the key changes but keeps other pages cached', async () => {
		// Astro empties the output dir each build, so a skipped page is restored
		// from its cached copy. Plant a sentinel in each: a restore keeps it, a
		// re-render overwrites it.
		fs.writeFileSync(cachedPlain, 'cached plain sentinel');
		fs.writeFileSync(cachedIsland, 'cached island sentinel');

		// Rebuild with a fresh (rotating) key.
		await fixture.build({ adapter: testAdapter() });

		// The plain page has no server island, so the new key does not affect it and
		// it is restored from the cache.
		assert.equal(await fixture.readFile('/client/plain/a/index.html'), 'cached plain sentinel');

		// The island page bakes key-bound ciphertext into its HTML, so the changed
		// key forces a re-render instead of a restore.
		const islandHtml = await fixture.readFile('/client/island/a/index.html');
		assert.notEqual(islandHtml, 'cached island sentinel');
		const $ = cheerio.load(islandHtml);
		assert.equal($('h1').text(), 'Island A');
	});
});
