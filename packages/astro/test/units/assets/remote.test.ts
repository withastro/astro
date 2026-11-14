import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { generateImagesForPath } from '../../../dist/assets/build/generate.js';
import { loadRemoteImage, revalidateRemoteImage } from '../../../dist/assets/build/remote.js';
import { createBasicSettings, createFixture, defaultLogger } from '../test-utils.ts';

function makeFetchMock(
	status: number,
	headerInit: Record<string, string> = {},
	body: ArrayBuffer = new ArrayBuffer(0),
	url = 'https://example.com/img.jpg',
): () => Promise<Response> {
	const headers = new Headers(headerInit);
	return async () =>
		({
			status,
			ok: status >= 200 && status < 300,
			headers,
			url,
			arrayBuffer: async () => body,
		}) as unknown as Response;
}

describe('revalidateRemoteImage', () => {
	it('returns null data on 304 Not Modified (cache still valid)', async () => {
		const result = await revalidateRemoteImage(
			'https://example.com/img.jpg',
			{ etag: '"abc123"' },
			makeFetchMock(304, { 'Cache-Control': 'max-age=3600', Etag: '"abc123"' }),
		);

		// null signals "cache is still valid, use the file on disk"
		assert.equal(result.data, null);
		// etag should be preserved from the stored revalidation data
		assert.equal(result.etag, '"abc123"');
		// expires should be a future timestamp
		assert.ok(result.expires > Date.now());
	});

	it('preserves lastModified from stored data on 304 when server omits the header', async () => {
		const result = await revalidateRemoteImage(
			'https://example.com/img.jpg',
			{ lastModified: 'Wed, 01 Jan 2025 00:00:00 GMT' },
			makeFetchMock(304, { 'Cache-Control': 'max-age=600' }),
		);

		assert.equal(result.data, null);
		assert.equal(result.lastModified, 'Wed, 01 Jan 2025 00:00:00 GMT');
	});

	it('returns image data on 200 OK (cache was stale)', async () => {
		const imageBytes = new Uint8Array([1, 2, 3, 4]).buffer;
		const result = await revalidateRemoteImage(
			'https://example.com/img.jpg',
			{ etag: '"oldtag"' },
			makeFetchMock(200, { 'Cache-Control': 'max-age=3600', Etag: '"newetag"' }, imageBytes),
		);

		assert.ok(result.data !== null);
		assert.ok(result.data.length > 0);
		assert.equal(result.etag, '"newetag"');
	});

	it('throws on server error responses (e.g. 500)', async () => {
		await assert.rejects(
			() =>
				revalidateRemoteImage('https://example.com/img.jpg', { etag: '"abc"' }, makeFetchMock(500)),
			/500/,
		);
	});
});

describe('loadRemoteImage', () => {
	it('successfully loads remote image from allowed domain', async () => {
		const imageBytes = new Uint8Array([1, 2, 3, 4, 5]).buffer;
		const result = await loadRemoteImage(
			'https://example.com/img.jpg',
			makeFetchMock(200, { 'Cache-Control': 'max-age=3600', Etag: '"test"' }, imageBytes),
			{ domains: ['example.com'], remotePatterns: [] },
		);

		assert.ok(result.data !== null);
		assert.equal(result.data.length, 5);
		assert.equal(result.etag, '"test"');
	});

	it('follows 301 redirect to allowed domain', async () => {
		const imageBytes = new Uint8Array([1, 2, 3, 4, 5]).buffer;

		let fetchCallCount = 0;
		const mockFetch = async (req: Request | string) => {
			fetchCallCount++;
			const requestUrl = typeof req === 'string' ? req : req.url;

			// First request: return 301 redirect
			if (fetchCallCount === 1) {
				return {
					status: 301,
					ok: false,
					headers: new Headers({ Location: 'https://cdn.example.com/img.jpg' }),
					url: requestUrl,
					arrayBuffer: async () => new ArrayBuffer(0),
				} as unknown as Response;
			}

			// Second request: return the actual image
			return {
				status: 200,
				ok: true,
				headers: new Headers({ 'Cache-Control': 'max-age=3600' }),
				url: 'https://cdn.example.com/img.jpg',
				arrayBuffer: async () => imageBytes,
			} as unknown as Response;
		};

		const result = await loadRemoteImage('https://example.com/img.jpg', mockFetch as any, {
			domains: ['example.com', 'cdn.example.com'],
			remotePatterns: [],
		});

		assert.equal(fetchCallCount, 2);
		assert.ok(result.data !== null);
		assert.equal(result.data.length, 5);
	});

	it('rejects redirect to disallowed domain', async () => {
		let fetchCallCount = 0;
		const mockFetch = async (_req: Request | string) => {
			fetchCallCount++;

			// First request: return 302 redirect to disallowed domain
			if (fetchCallCount === 1) {
				return {
					status: 302,
					ok: false,
					headers: new Headers({ Location: 'https://evil.com/img.jpg' }),
					url: 'https://example.com/img.jpg',
					arrayBuffer: async () => new ArrayBuffer(0),
				} as unknown as Response;
			}
		};

		await assert.rejects(
			() =>
				loadRemoteImage(
					'https://example.com/img.jpg',
					mockFetch as any,
					{ domains: ['example.com'], remotePatterns: [] }, // evil.com is not allowed
				),
			/not an allowed remote location/,
		);

		assert.equal(fetchCallCount, 1);
	});

	it('follows chain of redirects with all destinations allowed', async () => {
		const imageBytes = new Uint8Array([1, 2, 3]).buffer;

		let fetchCallCount = 0;
		const mockFetch: typeof fetch = async () => {
			fetchCallCount++;

			if (fetchCallCount === 1) {
				return {
					status: 301,
					ok: false,
					headers: new Headers({ Location: 'https://cdn1.example.com/img.jpg' }),
					url: 'https://example.com/img.jpg',
					arrayBuffer: async () => new ArrayBuffer(0),
				} as unknown as Response;
			}

			if (fetchCallCount === 2) {
				return {
					status: 302,
					ok: false,
					headers: new Headers({ Location: 'https://cdn2.example.com/img.jpg' }),
					url: 'https://cdn1.example.com/img.jpg',
					arrayBuffer: async () => new ArrayBuffer(0),
				} as unknown as Response;
			}

			// Final destination
			return {
				status: 200,
				ok: true,
				headers: new Headers({ 'Cache-Control': 'max-age=3600' }),
				url: 'https://cdn2.example.com/img.jpg',
				arrayBuffer: async () => imageBytes,
			} as unknown as Response;
		};

		const result = await loadRemoteImage('https://example.com/img.jpg', mockFetch, {
			domains: ['example.com', 'cdn1.example.com', 'cdn2.example.com'],
			remotePatterns: [],
		});

		assert.equal(fetchCallCount, 3);
		assert.ok(result.data !== null);
		assert.equal(result.data.length, 3);
	});

	it('throws on redirect with missing Location header', async () => {
		const mockFetch = async () =>
			({
				status: 301,
				ok: false,
				headers: new Headers({}),
				url: 'https://example.com/img.jpg',
				arrayBuffer: async () => new ArrayBuffer(0),
			}) as unknown as Response;

		await assert.rejects(
			() =>
				loadRemoteImage('https://example.com/img.jpg', mockFetch as any, {
					domains: ['example.com'],
					remotePatterns: [],
				}),
			/missing Location header/,
		);
	});

	it('throws on excessive redirects', async () => {
		let fetchCallCount = 0;
		const mockFetch = async () => {
			fetchCallCount++;
			return {
				status: 301,
				ok: false,
				headers: new Headers({ Location: `https://example.com/redirect-${fetchCallCount}` }),
				url: 'https://example.com/img.jpg',
				arrayBuffer: async () => new ArrayBuffer(0),
			} as unknown as Response;
		};

		await assert.rejects(
			() =>
				loadRemoteImage('https://example.com/img.jpg', mockFetch as any, {
					domains: ['example.com'],
					remotePatterns: [],
				}),
			/Maximum redirect depth exceeded/,
		);

		// Should have hit the redirect limit (10 by default)
		assert.ok(fetchCallCount >= 10);
	});
});

describe('generateImagesForPath remote image revalidation', () => {
	const src = 'https://images.example.com/redirect.png';
	const destination = 'https://cdn.example.com/image.png';

	for (const [name, image] of Object.entries({
		domains: { domains: ['images.example.com', 'cdn.example.com'], remotePatterns: [] },
		remotePatterns: { domains: [], remotePatterns: [{ hostname: '*.example.com' }] },
	})) {
		it(`revalidates redirected images allowed by image.${name}`, async (t) => {
			const fixture = await createFixture({
				'/cache/image.png': 'cached image',
				'/cache/image.png.json': JSON.stringify({ expires: 0, etag: '"cached-image"' }),
			});
			t.after(() => fixture.rm());
			const root = pathToFileURL(fixture.path + '/');
			const { config } = await createBasicSettings({ image });
			const fetch = t.mock.method(globalThis, 'fetch', async (request: Request) => {
				if (request.url === src) {
					return new Response(null, { status: 302, headers: { Location: destination } });
				}
				assert.equal(request.url, destination);
				return new Response(null, {
					status: 304,
					headers: { 'Cache-Control': 'public, max-age=3600' },
				});
			});

			await generateImagesForPath(
				src,
				{
					originalSrcPath: undefined,
					transforms: new Map([
						['image', { finalPath: '/_astro/image.png', transform: { src, format: 'png' } }],
					]),
				},
				{
					logger: defaultLogger,
					getImageService: async () => assert.fail('A 304 response should reuse the cached image'),
					referencedImages: new Set(),
					isSSR: false,
					count: { total: 1, current: 1 },
					useCache: true,
					assetsCacheDir: new URL('./cache/', root),
					serverRoot: new URL('./dist/', root),
					clientRoot: new URL('./dist/', root),
					imageConfig: { ...config.image, service: { entrypoint: 'test', config: {} } },
					assetsFolder: '_astro',
				},
			);

			assert.equal(fetch.mock.callCount(), 2);
			const metadata = JSON.parse(
				await fs.readFile(fixture.getPath('cache/image.png.json'), 'utf-8'),
			);
			assert.ok(metadata.expires > Date.now());
		});
	}
});
