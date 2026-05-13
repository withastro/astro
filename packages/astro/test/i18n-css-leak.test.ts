import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('CSS graph boundaries with astro:i18n', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/i18n-css-leak-basic/',
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build();
	});

	async function getPageCss(pathname: string) {
		const html = await fixture.readFile(pathname);
		const $ = cheerioLoad(html);
		const hrefs = $('link[rel=stylesheet]')
			.map((_index, el) => $(el).attr('href'))
			.get();
		const stylesheets = await Promise.all(hrefs.map((href) => fixture.readFile(href)));
		return stylesheets.join('\n');
	}

	it('does not attach docs-only CSS to unrelated pages', async () => {
		const css = await getPageCss('/index.html');
		assert.match(css, /background:#fff/);
		assert.doesNotMatch(css, /background:#000/);
		assert.doesNotMatch(css, /color:red/);
	});

	it('keeps docs-only CSS on the docs page', async () => {
		const css = await getPageCss('/docs/index.html');
		assert.match(css, /background:#000/);
		assert.match(css, /color:red/);
		assert.doesNotMatch(css, /background:#fff/);
	});
});
