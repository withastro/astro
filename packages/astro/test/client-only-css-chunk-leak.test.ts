import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('client:only CSS chunk leak', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/client-only-css-chunk-leak/',
		});
		await fixture.build();
	});

	it('does not leak CSS to pages that do not use CSS-importing client:only components', async () => {
		const html = await fixture.readFile('/about/index.html');
		const $ = cheerioLoad(html);

		const stylesheets = $('link[rel=stylesheet]');
		// The about page only uses CurrentTime (no CSS imports).
		// It should have no stylesheets from the shared chunk.
		assert.equal(stylesheets.length, 0, 'About page should have no stylesheet links');
	});

	it('includes CSS on the page that uses the CSS-importing client:only component', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);

		const stylesheets = await Promise.all(
			$('link[rel=stylesheet]').map((_, el) => {
				return fixture.readFile(el.attribs.href);
			}),
		);
		const css = stylesheets.join('');

		assert.match(css, /\.heavy-widget/, 'Home page should include .heavy-widget CSS');
	});
});
