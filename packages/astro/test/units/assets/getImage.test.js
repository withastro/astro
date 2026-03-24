import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { getImage } from '../../../dist/assets/internal.js';
import { installImageService } from '../mocks.js';

describe('getImage', () => {
	/** @type {ReturnType<typeof installImageService>} */
	let imageService;

	before(() => {
		imageService = installImageService({ domains: ['example.com', 'images.unsplash.com'] });
	});

	after(() => {
		imageService.cleanup();
	});

	/** Shorthand for calling getImage with the installed service config */
	function renderImage(props) {
		return getImage(props, imageService.imageConfig);
	}

	describe('remote constrained', () => {
		it('generates srcset with correct widths', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'A photo',
				layout: 'constrained',
			});
			const widths = result.srcSet.values.map((v) => v.transform.width);
			assert.ok(widths.includes(800));
			assert.equal(widths.at(-1), 1600);
			assert.ok(widths.every((w) => w <= 1600));
		});

		it('has correct sizes attribute', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'A photo',
				layout: 'constrained',
			});
			assert.equal(result.attributes.sizes, '(min-width: 800px) 800px, 100vw');
		});

		it('has correct width and height', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'A photo',
				layout: 'constrained',
			});
			assert.equal(result.attributes.width, 800);
			assert.equal(result.attributes.height, 600);
		});

		it('has lazy loading by default', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'A photo',
				layout: 'constrained',
			});
			assert.equal(result.attributes.loading, 'lazy');
			assert.equal(result.attributes.decoding, 'async');
			assert.equal(result.attributes.fetchpriority, undefined);
		});

		it('has data-astro-image attribute for layout', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'A photo',
				layout: 'constrained',
			});
			assert.equal(result.attributes['data-astro-image'], 'constrained');
		});

		it('src points to /_image endpoint', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'A photo',
				layout: 'constrained',
			});
			assert.ok(result.src.startsWith('/_image'));
		});

		it('srcset URLs point to /_image endpoint', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'A photo',
				layout: 'constrained',
			});
			for (const entry of result.srcSet.values) {
				assert.ok(entry.url.startsWith('/_image'));
			}
		});
	});

	describe('remote fixed', () => {
		it('generates srcset with 1x and 2x widths', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'Fixed photo',
				layout: 'fixed',
			});
			const widths = result.srcSet.values.map((v) => v.transform.width);
			assert.deepEqual(widths, [800, 1600]);
		});

		it('has fixed sizes attribute', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'Fixed photo',
				layout: 'fixed',
			});
			assert.equal(result.attributes.sizes, '800px');
		});

		it('has data-astro-image fixed', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'Fixed photo',
				layout: 'fixed',
			});
			assert.equal(result.attributes['data-astro-image'], 'fixed');
		});
	});

	describe('remote full-width', () => {
		it('generates srcset with all default breakpoints', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'Full width photo',
				layout: 'full-width',
			});
			const widths = result.srcSet.values.map((v) => v.transform.width);
			assert.ok(widths.length > 10);
			assert.ok(widths.includes(640));
			assert.ok(widths.includes(1920));
		});

		it('has 100vw sizes', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'Full width photo',
				layout: 'full-width',
			});
			assert.equal(result.attributes.sizes, '100vw');
		});

		it('has data-astro-image full-width', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'Full width photo',
				layout: 'full-width',
			});
			assert.equal(result.attributes['data-astro-image'], 'full-width');
		});
	});

	describe('constrained small (below min breakpoint)', () => {
		it('returns just 1x and 2x widths', async () => {
			const result = await renderImage({
				src: 'https://example.com/small.jpg',
				width: 300,
				height: 200,
				alt: 'Small',
				layout: 'constrained',
			});
			const widths = result.srcSet.values.map((v) => v.transform.width);
			assert.deepEqual(widths, [300, 600]);
		});
	});

	describe('priority loading', () => {
		it('has eager loading attributes', async () => {
			const result = await renderImage({
				src: 'https://example.com/hero.jpg',
				width: 1200,
				height: 800,
				alt: 'Hero',
				layout: 'constrained',
				loading: 'eager',
				decoding: 'sync',
			});
			assert.equal(result.attributes.loading, 'eager');
			assert.equal(result.attributes.decoding, 'sync');
		});
	});

	describe('fit and position in URLs', () => {
		it('includes fit parameter in srcset URLs', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 300,
				height: 400,
				alt: 'Fit cover',
				layout: 'constrained',
				fit: 'cover',
			});
			for (const entry of result.srcSet.values) {
				const params = new URL(entry.url, 'http://localhost').searchParams;
				assert.equal(params.get('fit'), 'cover');
			}
		});

		it('includes position parameter in srcset URLs', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 300,
				height: 400,
				alt: 'Position top',
				layout: 'constrained',
				fit: 'cover',
				position: 'top',
			});
			for (const entry of result.srcSet.values) {
				const params = new URL(entry.url, 'http://localhost').searchParams;
				assert.equal(params.get('pos'), 'top');
			}
		});

		it('preserves aspect ratio in srcset URLs', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 300,
				height: 400,
				alt: 'Aspect ratio',
				layout: 'constrained',
				fit: 'cover',
			});
			const aspectRatio = 300 / 400;
			for (const entry of result.srcSet.values) {
				const params = new URL(entry.url, 'http://localhost').searchParams;
				const w = Number(params.get('w'));
				const h = Number(params.get('h'));
				assert.ok(
					Math.abs(w / h - aspectRatio) < 0.01,
					`${w}/${h} should match aspect ratio ${aspectRatio}`,
				);
			}
		});

		it('does not include fit or position in result attributes', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 300,
				height: 400,
				alt: 'No fit attr',
				layout: 'constrained',
				fit: 'cover',
				position: 'center',
			});
			assert.equal(result.attributes.fit, undefined);
			assert.equal(result.attributes.position, undefined);
		});
	});

	describe('format', () => {
		it('defaults to webp format', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'Format test',
				layout: 'constrained',
			});
			const params = new URL(result.src, 'http://localhost').searchParams;
			assert.equal(params.get('f'), 'webp');
		});

		it('respects explicit format', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'Format test',
				format: 'png',
			});
			const params = new URL(result.src, 'http://localhost').searchParams;
			assert.equal(params.get('f'), 'png');
		});
	});

	describe('no layout', () => {
		it('does not add data-astro-image when no layout', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'No layout',
			});
			assert.equal(result.attributes['data-astro-image'], undefined);
		});

		it('does not add sizes when no layout', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 800,
				height: 600,
				alt: 'No layout',
			});
			assert.equal(result.attributes.sizes, undefined);
		});
	});
});

describe('getImage - remotePatterns', () => {
	describe('hostname pattern', () => {
		/** @type {ReturnType<typeof installImageService>} */
		let service;

		before(() => {
			service = installImageService({
				remotePatterns: [{ hostname: '**.example.com' }],
			});
		});

		after(() => {
			service.cleanup();
		});

		it('allows images matching the hostname pattern', async () => {
			const result = await getImage(
				{ src: 'https://cdn.example.com/photo.jpg', width: 800, height: 600, alt: 'test' },
				service.imageConfig,
			);
			assert.ok(result.src.startsWith('/_image'));
		});

		it('allows deeply nested subdomains', async () => {
			const result = await getImage(
				{ src: 'https://a.b.c.example.com/photo.jpg', width: 800, height: 600, alt: 'test' },
				service.imageConfig,
			);
			assert.ok(result.src.startsWith('/_image'));
		});

		it('returns raw URL for images not matching the pattern', async () => {
			const result = await getImage(
				{ src: 'https://evil.com/photo.jpg', width: 800, height: 600, alt: 'test' },
				service.imageConfig,
			);
			assert.equal(result.src, 'https://evil.com/photo.jpg');
		});
	});

	describe('hostname + pathname pattern', () => {
		/** @type {ReturnType<typeof installImageService>} */
		let service;

		before(() => {
			service = installImageService({
				remotePatterns: [{ hostname: 'cdn.example.com', pathname: '/images/**' }],
			});
		});

		after(() => {
			service.cleanup();
		});

		it('allows images matching both hostname and pathname', async () => {
			const result = await getImage(
				{ src: 'https://cdn.example.com/images/photo.jpg', width: 800, height: 600, alt: 'test' },
				service.imageConfig,
			);
			assert.ok(result.src.startsWith('/_image'));
		});

		it('returns raw URL when pathname does not match', async () => {
			const result = await getImage(
				{ src: 'https://cdn.example.com/other/photo.jpg', width: 800, height: 600, alt: 'test' },
				service.imageConfig,
			);
			assert.equal(result.src, 'https://cdn.example.com/other/photo.jpg');
		});
	});

	describe('protocol pattern', () => {
		/** @type {ReturnType<typeof installImageService>} */
		let service;

		before(() => {
			service = installImageService({
				remotePatterns: [{ hostname: 'example.com', protocol: 'https' }],
			});
		});

		after(() => {
			service.cleanup();
		});

		it('allows images with matching protocol', async () => {
			const result = await getImage(
				{ src: 'https://example.com/photo.jpg', width: 800, height: 600, alt: 'test' },
				service.imageConfig,
			);
			assert.ok(result.src.startsWith('/_image'));
		});

		it('returns raw URL for non-matching protocol', async () => {
			const result = await getImage(
				{ src: 'http://example.com/photo.jpg', width: 800, height: 600, alt: 'test' },
				service.imageConfig,
			);
			assert.equal(result.src, 'http://example.com/photo.jpg');
		});
	});

	describe('domains takes precedence', () => {
		/** @type {ReturnType<typeof installImageService>} */
		let service;

		before(() => {
			service = installImageService({
				domains: ['allowed.com'],
				remotePatterns: [{ hostname: '*.patterns.com' }],
			});
		});

		after(() => {
			service.cleanup();
		});

		it('allows images from domains list', async () => {
			const result = await getImage(
				{ src: 'https://allowed.com/photo.jpg', width: 800, height: 600, alt: 'test' },
				service.imageConfig,
			);
			assert.ok(result.src.startsWith('/_image'));
		});

		it('allows images from remotePatterns', async () => {
			const result = await getImage(
				{ src: 'https://cdn.patterns.com/photo.jpg', width: 800, height: 600, alt: 'test' },
				service.imageConfig,
			);
			assert.ok(result.src.startsWith('/_image'));
		});

		it('returns raw URL for images matching neither', async () => {
			const result = await getImage(
				{ src: 'https://other.com/photo.jpg', width: 800, height: 600, alt: 'test' },
				service.imageConfig,
			);
			assert.equal(result.src, 'https://other.com/photo.jpg');
		});
	});
});
