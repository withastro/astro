import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('@fontsource/* packages', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/fontsource-package/',
			outDir: './dist/fontsource/',
		});
		await fixture.build();
	});

	it('can be imported in frontmatter', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const assetPath = $('link').attr('href')!;
		const css = await fixture.readFile(assetPath);
		assert.equal(css.includes('Montserrat'), true);
	});
});
