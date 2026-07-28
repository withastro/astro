import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Aliases with tsconfig.json for Sass', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/alias-tsconfig-sass/',
		});
		await fixture.build();
	});

	it('resolves @use with extension via baseUrl', async () => {
		const html = await fixture.readFile('/extension/index.html');
		const $ = cheerio.load(html);
		// The style should be present (build would fail if Sass can't resolve the import)
		assert.ok($('style').length > 0 || $('link[rel=stylesheet]').length > 0, 'styles are rendered');
	});

	it('resolves extensionless @use via baseUrl', async () => {
		const html = await fixture.readFile('/extensionless/index.html');
		const $ = cheerio.load(html);
		assert.ok($('style').length > 0 || $('link[rel=stylesheet]').length > 0, 'styles are rendered');
	});

	it('resolves underscore-prefixed partial @use via baseUrl', async () => {
		const html = await fixture.readFile('/partial/index.html');
		const $ = cheerio.load(html);
		assert.ok($('style').length > 0 || $('link[rel=stylesheet]').length > 0, 'styles are rendered');
	});

	it('resolves @use with tsconfig paths alias', async () => {
		const html = await fixture.readFile('/paths-alias/index.html');
		const $ = cheerio.load(html);
		assert.ok($('style').length > 0 || $('link[rel=stylesheet]').length > 0, 'styles are rendered');
	});

	it('resolves Less @import via baseUrl', async () => {
		const html = await fixture.readFile('/less-baseurl/index.html');
		const $ = cheerio.load(html);
		// #1e90fe is @teal from src/tokens.less, resolved via baseUrl
		assert.match($('style').text(), /#1e90fe/, 'baseUrl Less variable is resolved and rendered');
	});

	it('resolves Less @import via tsconfig paths alias', async () => {
		const html = await fixture.readFile('/less-paths-alias/index.html');
		const $ = cheerio.load(html);
		// #6200ea is @primary from src/styles/theme.less, resolved via the "@styles/*" paths alias
		assert.match(
			$('style').text(),
			/#6200ea/,
			'paths alias Less variable is resolved and rendered',
		);
	});
});
