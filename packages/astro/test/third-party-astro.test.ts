import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('third-party .astro component', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/third-party-astro/',
			outDir: './dist/third-party-astro/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('renders a page using a third-party .astro component', async () => {
			const html = await fixture.readFile('/astro-embed/index.html');
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Third-Party .astro test');
		});
	});
});
