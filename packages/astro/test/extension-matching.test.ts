import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Matching .astro modules', () => {
	let fixture: Fixture;
	let output: string;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/extension-matching/',
			outDir: './dist/extension-matching/',
		});
		await fixture.build();
		output = await fixture.readFile('./index.html');
	});

	it('loads virtual modules with .astro in query string', async () => {
		const $ = cheerio.load(output);
		const title = $('h1').text();
		assert.strictEqual(title, 'true');
	});
});
