import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

// Regression test for https://github.com/withastro/astro/issues/15897
// Sass @use with bare specifiers should resolve against tsconfig baseUrl,
// including extensionless imports and underscore-prefixed partials.
describe('Sass imports with tsconfig baseUrl', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/alias-tsconfig-sass/',
			outDir: './dist/alias-tsconfig-sass/',
		});
		await fixture.build();
	});

	it('resolves @use with extension via baseUrl', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		assert.equal($('#with-ext').length, 1, 'Component with @use "colors.scss" should render');
	});

	it('resolves extensionless @use via baseUrl', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		assert.equal($('#no-ext').length, 1, 'Component with @use "colors" should render');
	});

	it('resolves underscore-prefixed partial @use via baseUrl', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		assert.equal($('#partial').length, 1, 'Component with @use "partials" (_partials.scss) should render');
	});
});
