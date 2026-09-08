import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('client:only child component styles', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/client-only-child-styles/',
		});
		await fixture.build();
	});

	it('includes scoped styles for child components inside client:only islands', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);

		const styles = $('style')
			.map((_, el) => $(el).text())
			.get()
			.join('');

		assert.match(
			styles,
			/\.styled-child/,
			'Index page should include scoped .styled-child CSS from the child of a client:only component',
		);
	});

	it('still includes scoped styles on the page using client:load directly', async () => {
		const html = await fixture.readFile('/about/index.html');
		const $ = cheerioLoad(html);

		const styles = $('style')
			.map((_, el) => $(el).text())
			.get()
			.join('');

		assert.match(
			styles,
			/\.styled-child/,
			'About page should include scoped .styled-child CSS from direct client:load usage',
		);
	});
});
