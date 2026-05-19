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

	it('uses the user image service for HTML attributes and static compile output', async () => {
		const html = readFileSync(
			fileURLToPath(new URL('dist/client/index.html', root)),
			'utf-8',
		);
		const $ = cheerio.load(html);
		const src = $('img').attr('src')!;
		assert.equal($('img').attr('data-image-service'), 'custom');
		assert.ok(
			src.startsWith('/_astro/') && src.endsWith('.webp'),
			`Expected compiled static image under /_astro/*.webp, got: ${src}`,
		);
	});
});
