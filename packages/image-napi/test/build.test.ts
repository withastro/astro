import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { before, describe, it } from 'node:test';
import { loadFixture } from 'astro/_internal/test/test-utils';
import * as cheerio from 'cheerio';
import sharp from 'sharp';

describe('@napi-rs/image service in an Astro build', () => {
	let fixture: Awaited<ReturnType<typeof loadFixture>>;
	let $: cheerio.CheerioAPI;

	before(async () => {
		fixture = await loadFixture({ root: new URL('./fixtures/basic/', import.meta.url).toString() });
		await fixture.build();
		$ = cheerio.load(await fixture.readFile('/index.html'));
	});

	async function metadataOf(src: string | undefined) {
		assert.ok(src, 'expected an image URL');
		const file = new URL(`./fixtures/basic/dist${src}`, import.meta.url);
		return sharp(await readFile(file)).metadata();
	}

	it('generates resized webp images', async () => {
		const metadata = await metadataOf($('#image').attr('src'));
		assert.equal(metadata.format, 'webp');
		assert.deepEqual([metadata.width, metadata.height], [300, 200]);
	});

	it('generates cropped avif images', async () => {
		const metadata = await metadataOf($('#cropped').attr('src'));
		assert.equal(metadata.format, 'heif');
		assert.deepEqual([metadata.width, metadata.height], [200, 200]);
	});

	it('generates every srcset candidate for pictures', async () => {
		const candidates = $('#picture')
			.parent()
			.find('source')
			.map((_, source) => $(source).attr('srcset')!.split(', '))
			.get()
			.map((candidate: string) => candidate.split(' ')[0]);
		assert.equal(candidates.length, 4);
		const widths = await Promise.all(candidates.map(async (src) => (await metadataOf(src)).width));
		assert.deepEqual(
			widths.sort((a, b) => a! - b!),
			[150, 150, 450, 450],
		);
	});
});
