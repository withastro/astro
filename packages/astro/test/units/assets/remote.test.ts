import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { revalidateRemoteImage } from '../../../dist/assets/build/remote.js';

function makeFetchMock(
	status: number,
	headerInit: Record<string, string> = {},
	body: ArrayBuffer = new ArrayBuffer(0),
): () => Promise<Response> {
	const headers = new Headers(headerInit);
	return async () =>
		({
			status,
			ok: status >= 200 && status < 300,
			headers,
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

	it('throws on redirect responses (e.g. 301)', async () => {
		await assert.rejects(
			() =>
				revalidateRemoteImage(
					'https://example.com/img.jpg',
					{ etag: '"abc"' },
					makeFetchMock(301, { Location: 'https://example.com/new.jpg' }),
				),
			/redirected/,
		);
	});

	it('throws on server error responses (e.g. 500)', async () => {
		await assert.rejects(
			() =>
				revalidateRemoteImage('https://example.com/img.jpg', { etag: '"abc"' }, makeFetchMock(500)),
			/500/,
		);
	});
});
