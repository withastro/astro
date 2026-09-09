import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadImage } from '../../../dist/assets/endpoint/loadImage.js';

const imageBytes = new Uint8Array([1, 2, 3, 4]).buffer;

function makeFetchFn(status: number, url: string): typeof globalThis.fetch {
	return async () =>
		({
			status,
			ok: status >= 200 && status < 300,
			headers: new Headers(),
			url,
			arrayBuffer: async () => imageBytes,
		}) as unknown as Response;
}

const emptyConfig = { domains: [] as string[], remotePatterns: [] as any[] };

describe('loadImage', () => {
	it('returns data for a local image (same-origin self-fetch)', async () => {
		const result = await loadImage(
			new URL('http://localhost:4321/_astro/test.abc123.png'),
			new Headers(),
			emptyConfig,
			false,
			makeFetchFn(200, 'http://localhost:4321/_astro/test.abc123.png'),
		);
		assert.ok(result, 'local image should return data');
		assert.equal(result.byteLength, 4);
	});

	it('returns undefined for an unauthorized remote image', async () => {
		const result = await loadImage(
			new URL('https://evil.com/image.png'),
			new Headers(),
			emptyConfig,
			true,
			makeFetchFn(200, 'https://evil.com/image.png'),
		);
		assert.equal(result, undefined);
	});

	it('returns data for an allowed remote image', async () => {
		const result = await loadImage(
			new URL('https://cdn.example.com/photo.jpg'),
			new Headers(),
			{ domains: ['cdn.example.com'], remotePatterns: [] },
			true,
			makeFetchFn(200, 'https://cdn.example.com/photo.jpg'),
		);
		assert.ok(result, 'allowed remote image should return data');
	});

	it('returns undefined when fetch fails', async () => {
		const result = await loadImage(
			new URL('http://localhost:4321/_astro/test.png'),
			new Headers(),
			emptyConfig,
			false,
			async () => {
				throw new Error('network error');
			},
		);
		assert.equal(result, undefined);
	});
});
