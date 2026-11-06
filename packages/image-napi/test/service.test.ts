import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { before, describe, it } from 'node:test';
import sharp from 'sharp';
import sharpService from 'astro/assets/services/sharp';
import service, { parseColor, parsePosition, planResize, resolveQuality } from '../dist/service.js';

const FIXTURE_IMAGE = new URL('./fixtures/600x400.jpg', import.meta.url);

function spyLogger() {
	const warnings: string[] = [];
	return {
		warnings,
		info: () => {},
		warn: (message: string) => warnings.push(message),
		error: () => {},
	};
}

function makeConfig(overrides: Record<string, unknown> = {}, serviceConfig = {}) {
	return { service: { entrypoint: '', config: serviceConfig }, ...overrides } as any;
}

async function run(input: Uint8Array, transform: Record<string, unknown>, config = makeConfig()) {
	const logger = spyLogger();
	const result = await service.transform(
		input,
		{ src: 'image.jpg', format: 'webp', ...transform } as any,
		config,
		logger,
	);
	const metadata = await sharp(result.data).metadata();
	return { ...result, metadata, warnings: logger.warnings };
}

async function highDetailJpeg() {
	const pixels = Buffer.alloc(400 * 300 * 3);
	for (let i = 0; i < pixels.length; i++) {
		pixels[i] = (Math.sin(i / 7) * 60 + 128 + ((i * 2654435761) % 64)) & 255;
	}
	return new Uint8Array(
		await sharp(pixels, { raw: { width: 400, height: 300, channels: 3 } })
			.jpeg({ quality: 95 })
			.toBuffer(),
	);
}

describe('@napi-rs/image service transforms', () => {
	let input: Uint8Array;
	let noisy: Uint8Array;
	before(async () => {
		input = new Uint8Array(await readFile(FIXTURE_IMAGE));
		noisy = await highDetailJpeg();
	});

	const sizes: Array<[string, Record<string, unknown>, number, number]> = [
		['both dimensions with cover', { width: 300, height: 400, fit: 'cover' }, 300, 400],
		['width only', { width: 300 }, 300, 200],
		['height only', { height: 400 }, 600, 400],
		['fit=inside', { width: 300, height: 400, fit: 'inside' }, 300, 200],
		['fit=contain', { width: 300, height: 400, fit: 'contain' }, 300, 200],
		['fit=outside', { width: 300, height: 400, fit: 'outside' }, 600, 400],
		['fit=fill', { width: 300, height: 100, fit: 'fill' }, 300, 100],
		['no upscale with cover', { width: 3000, height: 2000, fit: 'cover' }, 600, 400],
		['no upscale without fit', { width: 3000, height: 2000 }, 600, 400],
		['no upscale with one dimension and fit', { width: 3000, fit: 'cover' }, 600, 400],
	];

	for (const [name, transform, width, height] of sizes) {
		it(`resizes: ${name}`, async () => {
			const { metadata } = await run(input, transform);
			assert.deepEqual([metadata.width, metadata.height], [width, height]);
		});

		it(`matches the Sharp service geometry: ${name}`, async () => {
			const { data } = await sharpService.transform(
				input,
				{ src: 'image.jpg', format: 'webp', ...transform } as any,
				makeConfig(),
				spyLogger(),
			);
			const expected = await sharp(data).metadata();
			const { metadata } = await run(input, transform);
			assert.deepEqual([metadata.width, metadata.height], [expected.width, expected.height]);
		});
	}

	for (const format of ['webp', 'avif', 'png', 'jpeg', 'jpg'] as const) {
		it(`encodes ${format}`, async () => {
			const { format: resultFormat, metadata } = await run(input, { width: 100, format });
			assert.equal(resultFormat, format);
			assert.equal(
				metadata.format,
				format === 'jpg' ? 'jpeg' : format === 'avif' ? 'heif' : format,
			);
			assert.equal(metadata.width, 100);
		});
	}

	it('defaults to webp when no format is given', async () => {
		const { format, metadata } = await run(input, { width: 100, format: undefined });
		assert.equal(format, 'webp');
		assert.equal(metadata.format, 'webp');
	});

	it('applies quality presets and numbers', async () => {
		const low = await run(noisy, { quality: 'low' });
		const high = await run(noisy, { quality: 'high' });
		const numeric = await run(noisy, { quality: '25' });
		assert.ok(low.data.byteLength < high.data.byteLength);
		assert.equal(low.data.byteLength, numeric.data.byteLength);
	});

	it('applies EXIF orientation', async () => {
		const rotated = await sharp({
			create: { width: 400, height: 200, channels: 3, background: '#f00' },
		})
			.withMetadata({ orientation: 6 })
			.jpeg()
			.toBuffer();
		const { metadata } = await run(new Uint8Array(rotated), { width: 100 });
		assert.deepEqual([metadata.width, metadata.height], [100, 200]);
	});

	it('crops cover at the requested position', async () => {
		const redLeftBlueRight = await sharp({
			create: { width: 200, height: 100, channels: 3, background: '#f00' },
		})
			.composite([
				{
					input: { create: { width: 100, height: 100, channels: 3, background: '#00f' } },
					left: 100,
					top: 0,
				},
			])
			.png()
			.toBuffer();
		const pixel = async (position: string) => {
			const { data } = await run(new Uint8Array(redLeftBlueRight), {
				width: 50,
				height: 100,
				fit: 'cover',
				position,
				format: 'png',
			});
			const raw = await sharp(data).raw().toBuffer();
			return [raw[0], raw[1], raw[2]];
		};
		assert.deepEqual(await pixel('left'), [255, 0, 0]);
		assert.deepEqual(await pixel('right'), [0, 0, 255]);
	});

	it('flattens transparency onto the background color', async () => {
		const transparent = await sharp({
			create: { width: 10, height: 10, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
		})
			.png()
			.toBuffer();
		const { data } = await run(new Uint8Array(transparent), {
			format: 'png',
			background: '#00ff00',
		});
		const raw = await sharp(data).ensureAlpha().raw().toBuffer();
		assert.deepEqual([...raw.subarray(0, 4)], [0, 255, 0, 255]);
	});

	it('warns and ignores background colors it cannot parse', async () => {
		const { warnings } = await run(input, { width: 100, background: 'rebeccapurple' });
		assert.equal(warnings.length, 1);
		assert.match(warnings[0], /background color/);
	});

	it('passes GIFs through unoptimized with a warning', async () => {
		const gif = new Uint8Array(await sharp(input).gif().toBuffer());
		const logger = spyLogger();
		const result = await service.transform(
			gif,
			{ src: 'anim.gif', format: 'webp' } as any,
			makeConfig(),
			logger,
		);
		assert.equal(result.format, 'gif');
		assert.equal(result.data, gif);
		assert.equal(logger.warnings.length, 1);
	});

	it('rejects images above limitInputPixels', async () => {
		await assert.rejects(
			service.transform(
				input,
				{ src: 'big.jpg', format: 'webp' } as any,
				makeConfig({}, { limitInputPixels: 1000 }),
				spyLogger(),
			),
			/exceeds the pixel limit/,
		);
	});

	it('uses service config quality defaults', async () => {
		const lowConfig = makeConfig({}, { webp: { quality: 10 } });
		const lowDefault = await run(noisy, {}, lowConfig);
		const standard = await run(noisy, {});
		assert.ok(lowDefault.data.byteLength < standard.data.byteLength);
	});
});

describe('@napi-rs/image service SVG handling', () => {
	const SVG = new TextEncoder().encode(
		'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
	);

	it('rejects SVG sources unless dangerouslyProcessSVG is enabled', async () => {
		await assert.rejects(
			service.transform(SVG, { src: 'icon.svg', format: 'webp' } as any, makeConfig(), spyLogger()),
			/SVG image processing is disabled/,
		);
	});

	it('passes SVG output through', async () => {
		for (const format of ['svg', undefined]) {
			const result = await service.transform(
				SVG,
				{ src: 'icon.svg', format } as any,
				makeConfig(),
				spyLogger(),
			);
			assert.equal(result.format, 'svg');
			assert.equal(result.data, SVG);
		}
	});

	it('rasterizes SVG sources when dangerouslyProcessSVG is enabled', async () => {
		const { format, metadata } = await run(
			SVG,
			{ src: 'icon.svg', format: 'png' },
			makeConfig({ dangerouslyProcessSVG: true }),
		);
		assert.equal(format, 'png');
		assert.deepEqual([metadata.width, metadata.height], [10, 10]);
	});

	it('rasterizes SVG sources at the requested size', async () => {
		const { metadata } = await run(
			SVG,
			{ src: 'icon.svg', format: 'png', width: 4 },
			makeConfig({ dangerouslyProcessSVG: true }),
		);
		assert.deepEqual([metadata.width, metadata.height], [4, 4]);
	});

	it('rejects unidentifiable images', async () => {
		await assert.rejects(
			service.transform(
				new Uint8Array([1, 2, 3, 4]),
				{ src: 'junk.bin', format: 'webp' } as any,
				makeConfig(),
				spyLogger(),
			),
			/Could not process image metadata/,
		);
	});
});

describe('helpers', () => {
	it('resolveQuality', () => {
		assert.equal(resolveQuality(undefined), undefined);
		assert.equal(resolveQuality('mid'), 50);
		assert.equal(resolveQuality('72'), 72);
		assert.equal(resolveQuality(64), 64);
		assert.equal(resolveQuality('nonsense'), undefined);
	});

	it('parsePosition', () => {
		assert.deepEqual(parsePosition(undefined), [0.5, 0.5]);
		assert.deepEqual(parsePosition('top'), [0.5, 0]);
		assert.deepEqual(parsePosition('left bottom'), [0, 1]);
		assert.deepEqual(parsePosition('bottom left'), [0, 1]);
		assert.deepEqual(parsePosition('center top'), [0.5, 0]);
		assert.deepEqual(parsePosition('25% 75%'), [0.25, 0.75]);
		assert.deepEqual(parsePosition('northeast'), [1, 0]);
		assert.deepEqual(parsePosition('right top'), [1, 0]);
		assert.deepEqual(parsePosition('attention'), [0.5, 0.5]);
		assert.deepEqual(parsePosition('10px 20px'), [0.5, 0.5]);
	});

	it('parseColor', () => {
		assert.deepEqual(parseColor('#fff'), [255, 255, 255]);
		assert.deepEqual(parseColor('#00ff0080'), [0, 255, 0]);
		assert.deepEqual(parseColor('rgb(1, 2, 3)'), [1, 2, 3]);
		assert.deepEqual(parseColor('rgba(1 2 3 / 50%)'), [1, 2, 3]);
		assert.deepEqual(parseColor('White'), [255, 255, 255]);
		assert.equal(parseColor('rebeccapurple'), undefined);
	});

	it('planResize skips no-op resizes and centers cover crops', () => {
		assert.deepEqual(planResize(600, 400, { width: 600 }), {});
		assert.deepEqual(planResize(600, 400, { width: 300, height: 300, fit: 'cover' }), {
			resize: { width: 450, height: 300 },
			crop: { x: 75, y: 0, width: 300, height: 300 },
		});
	});
});
