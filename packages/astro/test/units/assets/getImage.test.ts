import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, describe, it } from 'node:test';
import { baseService } from '../../../dist/assets/services/service.js';
import type { GetImageResult, UnresolvedImageTransform } from '../../../dist/assets/types.js';
import { getImage } from '../../../dist/assets/internal.js';
import { installImageService } from '../mocks.ts';

describe('getImage', () => {
	let imageService: ReturnType<typeof installImageService>;

	before(() => {
		imageService = installImageService({ domains: ['example.com', 'images.unsplash.com'] });
	});

	after(() => {
		imageService.cleanup();
	});

	/** Shorthand for calling getImage with the installed service config */
	function renderImage(props: UnresolvedImageTransform): Promise<GetImageResult> {
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
			assert.ok(widths.every((w) => w! <= 1600));
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

		it('does not add inline style for position (CSP compliance)', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 300,
				height: 400,
				alt: 'Position test',
				layout: 'constrained',
				position: 'left top',
			});

			// Position should only live in the data attribute, not in inline styles
			assert.equal(result.attributes['data-astro-image-pos'], 'left-top');
			const style = result.attributes.style;
			if (typeof style === 'string') {
				assert.ok(
					!style.includes('object-position'),
					'inline style should not contain object-position',
				);
			} else if (typeof style === 'object' && style !== null) {
				assert.equal(
					'objectPosition' in style,
					false,
					'style object should not contain objectPosition',
				);
			}
		});

		it('preserves user-provided style without injecting position', async () => {
			const result = await renderImage({
				src: 'https://example.com/photo.jpg',
				width: 300,
				height: 400,
				alt: 'Merge test',
				layout: 'constrained',
				position: 'top right',
				style: { color: 'red' },
			});

			// User style should be preserved as-is, position only in data attribute
			assert.equal(result.attributes['data-astro-image-pos'], 'top-right');
			assert.deepStrictEqual(result.attributes.style, { color: 'red' });
		});
	});

	describe('format', () => {
		it('defaults to webp for remote images with a non-svg extension', async () => {
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

		it('defaults to svg for remote URLs ending in .svg so they pass through', async () => {
			const result = await renderImage({
				src: 'https://example.com/icon.svg',
				width: 64,
				height: 64,
				alt: 'Format test',
			});
			const params = new URL(result.src, 'http://localhost').searchParams;
			assert.equal(params.get('f'), 'svg');
		});

		it('defaults to svg for data:image/svg+xml so they pass through', async () => {
			// Data URIs aren't in the test allowlist, so the URL is returned as-is by getURL — verify
			// the resolved transform options instead.
			const svg = 'data:image/svg+xml,%3Csvg/%3E';
			const result = await renderImage({
				src: svg,
				width: 32,
				height: 32,
				alt: 'Format test',
			});
			assert.equal(result.options.format, 'svg');
		});

		it('omits format param for remote URLs without a detectable extension (resolved by /_image at request time)', async () => {
			const result = await renderImage({
				src: 'https://example.com/api/avatar',
				width: 64,
				height: 64,
				alt: 'Format test',
			});
			const params = new URL(result.src, 'http://localhost').searchParams;
			assert.equal(params.has('f'), false);
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
		let service: ReturnType<typeof installImageService>;

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
		let service: ReturnType<typeof installImageService>;

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
		let service: ReturnType<typeof installImageService>;

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
		let service: ReturnType<typeof installImageService>;

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

describe('getImage - peekRemoteFormatForStaticEmit', () => {
	let probedFormat: string | undefined;
	let probeCalls = 0;
	let probeError: Error | undefined;

	// `baseService.getURL` reads `import.meta.env.BASE_URL`, which isn't set in unit tests.
	const stubGetURL = (options: { src: string | { src: string } }) =>
		typeof options.src === 'string' ? options.src : options.src.src;

	const localServiceWithProbe = {
		...baseService,
		getURL: stubGetURL,
		// `isLocalService` only checks for `transform`, so a stub is enough.
		async transform() {
			return { data: new Uint8Array(), format: 'webp' };
		},
		async getRemoteSize(_url: string) {
			probeCalls++;
			if (probeError) throw probeError;
			return { format: probedFormat, width: 100, height: 100 };
		},
	};

	const imageConfig = {
		service: { entrypoint: 'test', config: {} },
		domains: ['example.com'],
		remotePatterns: [],
		endpoint: { route: '/_image' },
		dangerouslyProcessSVG: false,
		responsiveStyles: false,
	};

	beforeEach(() => {
		probedFormat = undefined;
		probeCalls = 0;
		probeError = undefined;
		(globalThis as any).astroAsset = {
			imageService: localServiceWithProbe,
			addStaticImage: () => '/_astro/peeked.hash.png',
		};
	});

	afterEach(() => {
		(globalThis as any).astroAsset = undefined;
	});

	it('commits the probed format when the URL has no detectable extension', async () => {
		probedFormat = 'png';
		const result = await getImage(
			{ src: 'https://example.com/api/avatar', width: 64, height: 64, alt: 'no-ext' },
			imageConfig,
		);
		assert.equal(probeCalls, 1);
		// Raster sources default to webp.
		assert.equal(result.options.format, 'webp');
	});

	it('preserves svg through the peek so SVGs do not get rasterized', async () => {
		probedFormat = 'svg';
		const result = await getImage(
			{ src: 'https://example.com/api/avatar', width: 64, height: 64, alt: 'svg-peek' },
			imageConfig,
		);
		assert.equal(probeCalls, 1);
		assert.equal(result.options.format, 'svg');
	});

	it('does not peek when the URL extension already resolved a format', async () => {
		probedFormat = 'svg';
		const result = await getImage(
			{ src: 'https://example.com/photo.jpg', width: 64, height: 64, alt: 'has-ext' },
			imageConfig,
		);
		assert.equal(probeCalls, 0);
		assert.equal(result.options.format, 'webp');
	});

	it('does not peek when the caller already set an explicit format', async () => {
		probedFormat = 'svg';
		const result = await getImage(
			{
				src: 'https://example.com/api/avatar',
				width: 64,
				height: 64,
				alt: 'explicit',
				format: 'png',
			},
			imageConfig,
		);
		assert.equal(probeCalls, 0);
		assert.equal(result.options.format, 'png');
	});

	it('does not peek when not running at build time (no addStaticImage)', async () => {
		probedFormat = 'svg';
		(globalThis as any).astroAsset = { imageService: localServiceWithProbe };
		const result = await getImage(
			{ src: 'https://example.com/api/avatar', width: 64, height: 64, alt: 'ssr' },
			imageConfig,
		);
		assert.equal(probeCalls, 0);
		assert.equal(result.options.format, undefined);
	});

	it('does not peek when the remote URL is not allowed', async () => {
		probedFormat = 'svg';
		const result = await getImage(
			{ src: 'https://untrusted.com/api/avatar', width: 64, height: 64, alt: 'blocked' },
			imageConfig,
		);
		assert.equal(probeCalls, 0);
		assert.equal(result.options.format, undefined);
	});

	it('does not peek for external (non-local) services', async () => {
		// External service has no `transform`, so `isLocalService` returns false.
		const externalService = {
			...baseService,
			getURL: stubGetURL,
			async getRemoteSize(_url: string) {
				probeCalls++;
				return { format: 'svg', width: 100, height: 100 };
			},
		};
		(globalThis as any).astroAsset = {
			imageService: externalService,
			addStaticImage: () => '/_astro/peeked.hash.png',
		};
		const result = await getImage(
			{ src: 'https://example.com/api/avatar', width: 64, height: 64, alt: 'external' },
			imageConfig,
		);
		assert.equal(probeCalls, 0);
		assert.equal(result.options.format, undefined);
	});

	it('falls back to undefined when the probe throws', async () => {
		probeError = new Error('network down');
		const result = await getImage(
			{ src: 'https://example.com/api/avatar', width: 64, height: 64, alt: 'probe-fail' },
			imageConfig,
		);
		assert.equal(probeCalls, 1);
		assert.equal(result.options.format, undefined);
	});
});
