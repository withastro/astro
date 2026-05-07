import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

const root = new URL('./fixtures/compile-custom-image-service/', import.meta.url);

describe('Compile with custom image service', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/compile-custom-image-service/',
		});
		await fixture.build();
	});

	after(async () => {
		await fixture.clean();
	});

	it('uses the user image service for URLs and HTML attributes in static HTML', async () => {
		const html = readFileSync(
			fileURLToPath(new URL('dist/client/index.html', root)),
			'utf-8',
		);
		const $ = cheerio.load(html);
		const src = $('img').attr('src')!;
		assert.ok(
			src.startsWith('/cdn/'),
			`Expected custom getURL() /cdn prefix on image src, got: ${src}`,
		);
		assert.equal($('img').attr('data-image-service'), 'custom');
	});
});
