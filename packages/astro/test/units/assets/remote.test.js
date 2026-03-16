// @ts-check
import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';

/**
 * Mock `fetch` to return controlled responses, then import `revalidateRemoteImage`.
 * This lets us verify status-code handling without hitting the network.
 */

/** Helper: build a minimal Response with the given status and headers */
function fakeResponse(status, headers = {}, body = '') {
	return new Response(body, { status, headers });
}

describe('revalidateRemoteImage', () => {
	it('does not throw on HTTP 304 Not Modified', async () => {
		const original = globalThis.fetch;
		try {
			// Stub fetch to return 304
			globalThis.fetch = mock.fn(() =>
				Promise.resolve(fakeResponse(304, { 'Cache-Control': 'max-age=3600' })),
			);

			const { revalidateRemoteImage } = await import(
				'../../../dist/assets/build/remote.js'
			);

			const result = await revalidateRemoteImage('https://example.com/img.jpg', {
				etag: '"abc123"',
			});

			// 304 means "not modified" — data buffer should be empty
			assert.equal(result.data.length, 0);
			// etag should be preserved from the revalidation data
			assert.equal(result.etag, '"abc123"');
		} finally {
			globalThis.fetch = original;
		}
	});

	it('throws on actual redirects (e.g. 301)', async () => {
		const original = globalThis.fetch;
		try {
			globalThis.fetch = mock.fn(() =>
				Promise.resolve(fakeResponse(301, { Location: 'https://example.com/new.jpg' })),
			);

			const { revalidateRemoteImage } = await import(
				'../../../dist/assets/build/remote.js'
			);

			await assert.rejects(
				() =>
					revalidateRemoteImage('https://example.com/img.jpg', {
						etag: '"abc123"',
					}),
				/redirected/,
			);
		} finally {
			globalThis.fetch = original;
		}
	});
});
