import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { revalidateRemoteImage, loadRemoteImage } from '../../../dist/assets/build/remote.js';

function makeFetchMock(
	status: number,
	headerInit: Record<string, string> = {},
	body: ArrayBuffer = new ArrayBuffer(0),
	url: string = 'https://example.com/img.jpg',
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

	it('follows redirects and validates final URL matches allowed pattern', async () => {
		let callCount = 0;
		const fetchMock: typeof fetch = async (req, init) => {
			callCount++;
			if (callCount === 1) {
				// First request returns a redirect
				return {
					status: 301,
					ok: false,
					headers: new Headers({ Location: 'https://example.com/redirected.jpg' }),
					url: 'https://example.com/img.jpg',
					arrayBuffer: async () => new ArrayBuffer(0),
				} as unknown as Response;
			} else {
				// Second request is the final destination
				const imageBytes = new Uint8Array([1, 2, 3, 4]).buffer;
				return {
					status: 200,
					ok: true,
					headers: new Headers({ 'Cache-Control': 'max-age=3600' }),
					url: 'https://example.com/redirected.jpg',
					arrayBuffer: async () => imageBytes,
				} as unknown as Response;
			}
		};

		const result = await revalidateRemoteImage(
			'https://example.com/img.jpg',
			{ etag: '"abc123"' },
			fetchMock,
			{ remotePatterns: [{ hostname: 'example.com' }], domains: [] },
		);

		assert.ok(result.data !== null);
		assert.equal(callCount, 2);
	});

	it('throws when redirect target does not match allowed patterns', async () => {
		const fetchMock: typeof fetch = async (req) => {
			return {
				status: 301,
				ok: false,
				headers: new Headers({ Location: 'https://blocked.com/img.jpg' }),
				url: 'https://example.com/img.jpg',
				arrayBuffer: async () => new ArrayBuffer(0),
			} as unknown as Response;
		};

		await assert.rejects(
			() =>
				revalidateRemoteImage(
					'https://example.com/img.jpg',
					{ etag: '"abc123"' },
					fetchMock,
					{ remotePatterns: [{ hostname: 'example.com' }], domains: [] },
				),
			/not an allowed remote location/,
		);
	});
});

describe('loadRemoteImage', () => {
	it('loads image and validates it matches allowed pattern', async () => {
		const imageBytes = new Uint8Array([1, 2, 3, 4]).buffer;
		const result = await loadRemoteImage(
			'https://example.com/img.jpg',
			makeFetchMock(200, { 'Cache-Control': 'max-age=3600' }, imageBytes),
			{ remotePatterns: [{ hostname: 'example.com' }], domains: [] },
		);

		assert.ok(result.data !== null);
		assert.ok(result.data.length > 0);
	});

	it('follows redirects and validates final URL', async () => {
		let callCount = 0;
		const fetchMock: typeof fetch = async (req, init) => {
			callCount++;
			if (callCount === 1) {
				// First request returns a redirect
				return {
					status: 301,
					ok: false,
					headers: new Headers({ Location: 'https://cdn.example.com/img.jpg' }),
					url: 'https://example.com/img.jpg',
					arrayBuffer: async () => new ArrayBuffer(0),
				} as unknown as Response;
			} else {
				// Second request is the final destination
				const imageBytes = new Uint8Array([1, 2, 3, 4]).buffer;
				return {
					status: 200,
					ok: true,
					headers: new Headers({ 'Cache-Control': 'max-age=3600' }),
					url: 'https://cdn.example.com/img.jpg',
					arrayBuffer: async () => imageBytes,
				} as unknown as Response;
			}
		};

		const result = await loadRemoteImage(
			'https://example.com/img.jpg',
			fetchMock,
			{ remotePatterns: [{ hostname: '**.example.com' }], domains: [] },
		);

		assert.ok(result.data !== null);
		assert.equal(callCount, 2);
	});

	it('throws when redirect target does not match allowed patterns', async () => {
		const fetchMock: typeof fetch = async (req) => {
			return {
				status: 301,
				ok: false,
				headers: new Headers({ Location: 'https://malicious.com/img.jpg' }),
				url: 'https://example.com/img.jpg',
				arrayBuffer: async () => new ArrayBuffer(0),
			} as unknown as Response;
		};

		await assert.rejects(
			() =>
				loadRemoteImage(
					'https://example.com/img.jpg',
					fetchMock,
					{ remotePatterns: [{ hostname: 'example.com' }], domains: [] },
				),
			/not an allowed remote location/,
		);
	});
});
