import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { before, describe, it } from 'node:test';
import { lookup as probe } from '../../../dist/assets/utils/vendor/image-size/lookup.js';

// Small local image (600×400) to keep transforms fast without depending on external fixtures
const FIXTURE_IMAGE = new URL('./600x400.jpg', import.meta.url);
const ORIGINAL_WIDTH = 600;
const ORIGINAL_HEIGHT = 400;

describe('sharp image service', async () => {
	const sharpService = (await import('../../../dist/assets/services/sharp.js')).default;

	const config = { service: { entrypoint: '', config: {} } };

	let inputBuffer;
	before(async () => {
		inputBuffer = new Uint8Array(await readFile(FIXTURE_IMAGE));
	});

	async function transform(opts) {
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
