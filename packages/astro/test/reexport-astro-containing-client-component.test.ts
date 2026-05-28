import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Re-exported astro components with client components', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/reexport-astro-containing-client-component/',
			outDir: './dist/reexport-astro-containing-client-component/',
		});
		await fixture.build();
	});

	it('Is able to build and renders and stuff', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		assert.equal($('astro-island').length, 1);
		assert.equal($('astro-island').attr('component-export'), 'One');
	});
});
