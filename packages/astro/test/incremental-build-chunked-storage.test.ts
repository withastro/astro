import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

// The chunked data store emits each collection part as a `?raw` import. Those
// chunks carry the serialized content bytes, so unless the data-store module is
// tagged as content-data (and pruned from the per-route dependency hash), a
// single content edit changes the hash of every keyed content page and defeats
// selective caching. This fixture reuses the content-collection setup from
// `incremental-build` under `collectionStorage: 'chunked'`.
describe('experimental.incrementalBuild chunked collection storage', () => {
	const root = new URL('./fixtures/incremental-build/', import.meta.url);
	const cachedDocB = new URL('node_modules/.astro-chunked/dist/docs/b/index.html', root);
	const docA = new URL('src/content/docs/a.mdx', root);
	let fixture: Fixture;
	let originalDocA: string;

	async function build(): Promise<void> {
		fixture = await loadFixture({
			root,
			outDir: './dist/incremental-build-chunked/',
			cacheDir: './node_modules/.astro-chunked/',
			experimental: {
				incrementalBuild: true,
				collectionStorage: 'chunked',
			},
		});
		await fixture.build();
	}

	before(async () => {
		fs.rmSync(new URL('dist/incremental-build-chunked/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro-chunked/', root), { recursive: true, force: true });
		originalDocA = fs.readFileSync(docA, 'utf-8');

		await build();

		// Plant a sentinel in the cached copy of the unrelated page. A skipped page
		// is restored from this cache copy, so it keeps the sentinel; a re-rendered
		// page overwrites it.
		fs.writeFileSync(cachedDocB, 'cached doc b sentinel');
		fs.writeFileSync(docA, originalDocA.replace('Alpha content.', 'Alpha updated content.'));

		await build();
	});

	it('re-renders the edited content page', async () => {
		const docAHtml = await fixture.readFile('/docs/a/index.html');
		const $ = cheerio.load(docAHtml);
		assert.equal($('h1').text(), 'Doc A');
		assert.equal($('p').last().text(), 'Alpha updated content.');
	});

	it('keeps an unrelated content page cached when a different entry changes', async () => {
		const docB = await fixture.readFile('/docs/b/index.html');
		assert.equal(docB, 'cached doc b sentinel');
	});

	after(() => {
		fs.writeFileSync(docA, originalDocA);
	});
});
