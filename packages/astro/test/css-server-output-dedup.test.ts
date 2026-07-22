import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { loadFixture, type App, type Fixture } from './test-utils.ts';

// https://github.com/withastro/astro/issues/17298
describe('CSS deduplication between prerender and SSR environments', () => {
	let fixture: Fixture;
	let app: App;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/css-server-output-dedup/',
			output: 'server',
			adapter: testAdapter(),
			build: {
				inlineStylesheets: 'never',
			},
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('emits a single CSS file for a layout shared by prerendered and server-rendered pages', async () => {
		const assets = await fixture.readdir('/client/_astro');
		const cssFiles = assets.filter((f) => f.endsWith('.css'));
		assert.equal(cssFiles.length, 1, `Expected a single CSS file, found: ${cssFiles.join(', ')}`);
	});

	it('references the same CSS file from the prerendered and the server-rendered page', async () => {
		const assets = await fixture.readdir('/client/_astro');
		const cssFile = assets.find((f) => f.endsWith('.css'));
		assert.ok(cssFile);

		const staticHtml = await fixture.readFile('/client/index.html');
		const $static = cheerio.load(staticHtml);
		const staticHref = $static('link[rel=stylesheet]').attr('href');
		assert.equal(staticHref, `/_astro/${cssFile}`);

		const response = await app.render(new Request('http://example.com/dynamic/foo'));
		const dynamicHtml = await response.text();
		const $dynamic = cheerio.load(dynamicHtml);
		const dynamicHref = $dynamic('link[rel=stylesheet]').attr('href');
		assert.equal(dynamicHref, `/_astro/${cssFile}`);
	});
});
