import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { before, describe, it } from 'node:test';
import { lookup as probe } from '../../../dist/assets/utils/vendor/image-size/lookup.js';

// Small local image (600×400) to keep transforms fast without depending on external fixtures
const FIXTURE_IMAGE = new URL('./600x400.jpg', import.meta.url);
const ORIGINAL_WIDTH = 600;
const ORIGINAL_HEIGHT = 400;

describe('sharp encoder options', async () => {
	const { resolveSharpEncoderOptions } = await import('../../../dist/assets/services/sharp.js');

	it('uses codec-specific config defaults when no transform quality is provided', () => {
		assert.deepEqual(
			resolveSharpEncoderOptions({ format: 'webp' }, undefined, {
				webp: {
					effort: 6,
					alphaQuality: 80,
					quality: 72,
				},
			}),
			{
				effort: 6,
				alphaQuality: 80,
				quality: 72,
			},
		);
	});

	it('prefers transform quality over config quality', () => {
		assert.deepEqual(
			resolveSharpEncoderOptions({ format: 'avif', quality: '70' }, undefined, {
				avif: {
					effort: 9,
					quality: 50,
				},
			}),
			{
				effort: 9,
				quality: 70,
			},
		);
	});

	it('maps jpg output to jpeg encoder defaults', () => {
		assert.deepEqual(
			resolveSharpEncoderOptions({ format: 'jpg' }, undefined, {
				jpeg: {
					mozjpeg: true,
					chromaSubsampling: '4:2:0',
				},
			}),
			{
				mozjpeg: true,
				chromaSubsampling: '4:2:0',
			},
		);
	});

	it('keeps animated gif webp loop default unless config overrides it', () => {
		assert.deepEqual(
			resolveSharpEncoderOptions({ format: 'webp' }, 'gif', {
				webp: {
					effort: 5,
				},
			}),
			{
				effort: 5,
				loop: 0,
			},
		);

		assert.deepEqual(
			resolveSharpEncoderOptions({ format: 'webp' }, 'gif', {
				webp: {
					effort: 5,
					loop: 2,
				},
			}),
			{
				effort: 5,
				loop: 2,
			},
		);
	});
});

describe('sharp image service', async () => {
	const sharpService = (await import('../../../dist/assets/services/sharp.js')).default;

	const config: any = { service: { entrypoint: '', config: {} } };

	let inputBuffer: Uint8Array;
	before(async () => {
		inputBuffer = new Uint8Array(await readFile(FIXTURE_IMAGE));
	});

	async function transform(opts: Record<string, unknown>) {
		const { data } = await sharpService.transform(
			inputBuffer,
			{ src: 'penguin.jpg', format: 'webp', ...opts },
			config,
		);
		return probe(data);
	}

	it('generates correct width and height when both are provided', async () => {
		const { width, height } = await transform({ width: 300, height: 400, fit: 'cover' });
		assert.equal(width, 300);
		assert.equal(height, 400);
	});

	it('generates correct height when only width is provided', async () => {
		const { width, height } = await transform({ width: 300 });
		assert.equal(width, 300);
		assert.equal(height, 200);
	});

	it('generates correct width when only height is provided', async () => {
		const { width, height } = await transform({ height: 400 });
		assert.equal(width, 600);
		assert.equal(height, 400);
	});

	it('preserves aspect ratio when fit=inside', async () => {
		const { width, height } = await transform({ width: 300, height: 400, fit: 'inside' });
		assert.equal(width, 300);
		assert.equal(height, 200);
	});

	it('preserves aspect ratio when fit=contain', async () => {
		const { width, height } = await transform({ width: 300, height: 400, fit: 'contain' });
		assert.equal(width, 300);
		assert.equal(height, 200);
	});

	it('preserves aspect ratio when fit=outside', async () => {
		const { width, height } = await transform({ width: 300, height: 400, fit: 'outside' });
		assert.equal(width, 600);
		assert.equal(height, 400);
	});

	it('does not upscale image if requested size is larger than original', async () => {
		const { width, height } = await transform({ width: 3000, height: 2000, fit: 'cover' });
		assert.equal(width, ORIGINAL_WIDTH);
		assert.equal(height, ORIGINAL_HEIGHT);
	});

	it('does not upscale image if requested size is larger than original and fit is unset', async () => {
		const { width, height } = await transform({ width: 3000, height: 2000 });
		assert.equal(width, ORIGINAL_WIDTH);
		assert.equal(height, ORIGINAL_HEIGHT);
	});

	it('does not upscale if only one dimension is provided and fit is set', async () => {
		const { width, height } = await transform({ width: 3000, fit: 'cover' });
		assert.equal(width, ORIGINAL_WIDTH);
		assert.equal(height, ORIGINAL_HEIGHT);
	});
});
