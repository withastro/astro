import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('HTML Component', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/html-component/',
			outDir: './dist/html-component/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('works', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			const h1 = $('h1');
			const foo = $('#foo');

			assert.equal(h1.text(), 'Hello component!');
			assert.equal(foo.text(), 'bar');
		});
	});
});
