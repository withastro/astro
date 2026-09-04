import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, isWindows, loadFixture } from './test-utils.ts';

describe('Aliases', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/alias/',
			outDir: './dist/alias/',
		});
	});

	if (isWindows) return;

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('can load client components', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// Should render aliased element
			assert.equal($('#client').text(), 'test');

			const scripts = $('script').toArray();
			assert.ok(scripts.length > 0);
		});

		it('can use aliases and relative in same project', async () => {
			const html = await fixture.readFile('/two/index.html');
			const $ = cheerio.load(html);

			// Should render aliased element
			assert.equal($('#client').text(), 'test');

			const scripts = $('script').toArray();
			assert.ok(scripts.length > 0);
		});
	});
});
