import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { loadFixture, type App, type Fixture } from './test-utils.ts';

// https://github.com/withastro/astro/issues/17298
describe('CSS deduplication between prerender and SSR environments', () => {
	let fixture: Fixture;
	let app: App;

	async function stylesheetHrefs(html: string): Promise<string[]> {
		const $ = cheerio.load(html);
		return $('link[rel=stylesheet]')
			.toArray()
			.map((el) => $(el).attr('href'))
			.filter((href): href is string => typeof href === 'string');
	}

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
		// One file for the shared layout CSS, one for the CSS unique to the
		// server-rendered /special page.
		assert.equal(cssFiles.length, 2, `Expected 2 CSS files, found: ${cssFiles.join(', ')}`);
	});

	it('references the same shared CSS file from every page', async () => {
		const assets = await fixture.readdir('/client/_astro');
		const cssFiles = assets.filter((f) => f.endsWith('.css'));

		const staticHrefs = await stylesheetHrefs(await fixture.readFile('/client/index.html'));
		assert.equal(staticHrefs.length, 1);
		const sharedHref = staticHrefs[0];

		const aboutHrefs = await stylesheetHrefs(await fixture.readFile('/client/about/index.html'));
		assert.deepEqual(aboutHrefs, [sharedHref]);

		const response = await app.render(new Request('http://example.com/dynamic/foo'));
		const dynamicHrefs = await stylesheetHrefs(await response.text());
		assert.deepEqual(dynamicHrefs, [sharedHref]);

		assert.ok(
			cssFiles.includes(sharedHref.replace('/_astro/', '')),
			`Shared stylesheet ${sharedHref} should exist in the build output`,
		);
	});

	it('keeps CSS that is unique to a server-rendered page', async () => {
		const staticHrefs = await stylesheetHrefs(await fixture.readFile('/client/index.html'));
		const sharedHref = staticHrefs[0];

		const response = await app.render(new Request('http://example.com/special'));
		const specialHrefs = await stylesheetHrefs(await response.text());

		assert.ok(
			specialHrefs.includes(sharedHref),
			`/special should link the shared stylesheet, found: ${specialHrefs.join(', ')}`,
		);
		const uniqueHrefs = specialHrefs.filter((href) => href !== sharedHref);
		assert.equal(
			uniqueHrefs.length,
			1,
			`/special should link exactly one unique stylesheet, found: ${specialHrefs.join(', ')}`,
		);

		const uniqueCss = await fixture.readFile(`/client${uniqueHrefs[0]}`);
		assert.ok(
			uniqueCss.includes('special-marker'),
			'The unique stylesheet should contain the styles of the /special page',
		);
	});
});
