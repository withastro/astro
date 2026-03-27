import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Vue styles shared with client:only components', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/vue-client-only-shared-styles/',
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build();
	});

	async function readLinkedCss(filepath) {
		const html = await fixture.readFile(filepath);
		const $ = cheerioLoad(html);
		const stylesheets = await Promise.all(
			$('link[rel=stylesheet]').map((_, el) => fixture.readFile(el.attribs.href)),
		);

		return stylesheets.join('');
	}

	it('keeps the shared Vue component styles on the client:load page', async () => {
		const css = await readLinkedCss('/index.html');
		assert.match(css, /--issue-16119:\s*1/, 'HydratedHeader styles should remain on /index');
	});

	it('keeps the shared Vue component styles on the client:only page', async () => {
		const css = await readLinkedCss('/about/index.html');
		assert.match(
			css,
			/--issue-16119:\s*1/,
			'HydratedHeader styles should remain on /about when nested under client:only',
		);
	});
});
