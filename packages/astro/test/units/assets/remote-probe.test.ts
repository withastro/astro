import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inferRemoteSize } from '../../../dist/assets/utils/remoteProbe.js';

// Minimal valid JPEG header (enough for image-size to detect dimensions)
// This is a 1x1 JPEG
const JPEG_1x1 = new Uint8Array([
	0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
	0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11,
	0x00, 0xff, 0xd9,
]);

function createMockFetch(callTracker: { count: number }) {
	return async (_req: Request | string, _init?: RequestInit) => {
		callTracker.count++;
		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(JPEG_1x1);
				controller.close();
			},
		});
		return new Response(stream, {
			status: 200,
			headers: { 'Content-Type': 'image/jpeg' },
		});
	};
}

// The probeCache is module-level state, so we need unique URLs per test.
let testCounter = 0;
function uniqueUrl() {
	return `https://example.com/test-image-${++testCounter}.jpg`;
}

describe('inferRemoteSize', () => {
	it('caches results for the same URL to avoid redundant fetches', async () => {
		const tracker = { count: 0 };
		const originalFetch = globalThis.fetch;
		globalThis.fetch = createMockFetch(tracker) as typeof fetch;

		try {
			const url = uniqueUrl();

			// Call inferRemoteSize multiple times concurrently (simulates Picture component)
			const [result1, result2, result3] = await Promise.all([
				inferRemoteSize(url),
				inferRemoteSize(url),
				inferRemoteSize(url),
			]);

			// All results should be identical
			assert.equal(result1.width, 1);
			assert.equal(result1.height, 1);
			assert.deepEqual(result1, result2);
			assert.deepEqual(result1, result3);

			// Only one fetch should have been made
			assert.equal(tracker.count, 1, 'Expected only 1 fetch call, but got ' + tracker.count);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it('caches results for sequential calls to the same URL', async () => {
		const tracker = { count: 0 };
		const originalFetch = globalThis.fetch;
		globalThis.fetch = createMockFetch(tracker) as typeof fetch;

		try {
			const url = uniqueUrl();

			const result1 = await inferRemoteSize(url);
			const result2 = await inferRemoteSize(url);

			assert.deepEqual(result1, result2);
			assert.equal(tracker.count, 1, 'Expected only 1 fetch call for sequential calls');
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it('makes separate fetches for different URLs', async () => {
		const tracker = { count: 0 };
		const originalFetch = globalThis.fetch;
		globalThis.fetch = createMockFetch(tracker) as typeof fetch;

		try {
			const url1 = uniqueUrl();
			const url2 = uniqueUrl();

			const [result1, result2] = await Promise.all([inferRemoteSize(url1), inferRemoteSize(url2)]);

			assert.equal(result1.width, 1);
			assert.equal(result2.width, 1);
			assert.equal(tracker.count, 2, 'Expected 2 fetch calls for different URLs');
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
