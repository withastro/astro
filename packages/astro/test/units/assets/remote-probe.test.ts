import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { describe, it } from 'node:test';
import { inferRemoteSize } from '../../../dist/assets/utils/index.js';

describe('inferRemoteSize', () => {
	// Enough PNG header metadata for dimension inference.
	const TINY_PNG_HEADER = new Uint8Array([
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
		0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
	]);

	it('retries network errors and returns dimensions when a later attempt succeeds', async () => {
		let requests = 0;

		const server = createServer((req, res) => {
			requests++;
			if (requests <= 2) {
				req.socket.destroy();
				return;
			}

			res.writeHead(200, { 'Content-Type': 'image/png' });
			res.end(TINY_PNG_HEADER);
		});

		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

		const address = server.address();
		assert.ok(address && typeof address === 'object');

		const origin = `http://127.0.0.1:${address.port}`;

		try {
			const result = await inferRemoteSize(`${origin}/image.png`, {
				domains: [],
				remotePatterns: [{ protocol: 'http', hostname: '127.0.0.1', port: String(address.port) }],
			});

			assert.equal(requests, 3);
			assert.equal(result.width, 1);
			assert.equal(result.height, 1);
			assert.equal(result.format, 'png');
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
	});

	it('does not retry a final 404 response', async () => {
		let requests = 0;

		const server = createServer((_req, res) => {
			requests++;
			res.writeHead(404);
			res.end();
		});

		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

		const address = server.address();
		assert.ok(address && typeof address === 'object');

		const origin = `http://127.0.0.1:${address.port}`;

		try {
			await assert.rejects(
				() =>
					inferRemoteSize(`${origin}/missing.png`, {
						domains: [],
						remotePatterns: [
							{ protocol: 'http', hostname: '127.0.0.1', port: String(address.port) },
						],
					}),
				{ name: 'FailedToFetchRemoteImageDimensions' },
			);

			assert.equal(requests, 1);
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
	});

	it('does not retry a final 5xx response', async () => {
		let requests = 0;

		const server = createServer((_req, res) => {
			requests++;
			res.writeHead(503);
			res.end();
		});

		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

		const address = server.address();
		assert.ok(address && typeof address === 'object');

		const origin = `http://127.0.0.1:${address.port}`;

		try {
			await assert.rejects(
				() =>
					inferRemoteSize(`${origin}/unavailable.png`, {
						domains: [],
						remotePatterns: [
							{ protocol: 'http', hostname: '127.0.0.1', port: String(address.port) },
						],
					}),
				{ name: 'FailedToFetchRemoteImageDimensions' },
			);

			assert.equal(requests, 1);
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
	});

	it('does not retry directly disallowed remote URLs', async () => {
		await assert.rejects(
			() =>
				inferRemoteSize('https://not-allowed.example/image.png', {
					domains: ['example.com'],
					remotePatterns: [],
				}),
			{ name: 'RemoteImageNotAllowed' },
		);
	});

	it('does not retry or mask disallowed redirects', async () => {
		let requests = 0;

		const server = createServer((_req, res) => {
			requests++;
			res.writeHead(302, { Location: 'https://not-allowed.example/image.png' });
			res.end();
		});

		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

		const address = server.address();
		assert.ok(address && typeof address === 'object');

		const origin = `http://127.0.0.1:${address.port}`;

		try {
			await assert.rejects(
				() =>
					inferRemoteSize(`${origin}/redirect.png`, {
						domains: [],
						remotePatterns: [
							{ protocol: 'http', hostname: '127.0.0.1', port: String(address.port) },
						],
					}),
				{ name: 'RemoteImageNotAllowed' },
			);

			assert.equal(requests, 1);
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
	});

	it('does not retry redirects with missing Location headers', async () => {
		let requests = 0;

		const server = createServer((_req, res) => {
			requests++;
			res.writeHead(302);
			res.end();
		});

		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

		const address = server.address();
		assert.ok(address && typeof address === 'object');

		const origin = `http://127.0.0.1:${address.port}`;

		try {
			await assert.rejects(
				() =>
					inferRemoteSize(`${origin}/redirect.png`, {
						domains: [],
						remotePatterns: [
							{ protocol: 'http', hostname: '127.0.0.1', port: String(address.port) },
						],
					}),
				{ name: 'FailedToFetchRemoteImageDimensions' },
			);

			assert.equal(requests, 1);
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
	});

	it('does not retry after max redirect depth is reached', async () => {
		let requests = 0;

		const server = createServer((_req, res) => {
			requests++;
			res.writeHead(302, { Location: `/redirect-${requests}.png` });
			res.end();
		});

		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

		const address = server.address();
		assert.ok(address && typeof address === 'object');

		const origin = `http://127.0.0.1:${address.port}`;

		try {
			await assert.rejects(
				() =>
					inferRemoteSize(`${origin}/redirect.png`, {
						domains: [],
						remotePatterns: [
							{ protocol: 'http', hostname: '127.0.0.1', port: String(address.port) },
						],
					}),
				{ name: 'FailedToFetchRemoteImageDimensions' },
			);

			assert.equal(requests, 10);
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
	});

	it('retries network errors after allowed redirects', async () => {
		let redirectRequests = 0;
		let imageRequests = 0;

		const server = createServer((req, res) => {
			if (req.url === '/redirect.png') {
				redirectRequests++;
				res.writeHead(302, { Location: '/image.png' });
				res.end();
				return;
			}

			imageRequests++;
			if (imageRequests === 1) {
				req.socket.destroy();
				return;
			}

			res.writeHead(200, { 'Content-Type': 'image/png' });
			res.end(TINY_PNG_HEADER);
		});
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

		const address = server.address();
		assert.ok(address && typeof address === 'object');

		const origin = `http://127.0.0.1:${address.port}`;

		try {
			const result = await inferRemoteSize(`${origin}/redirect.png`, {
				domains: [],
				remotePatterns: [{ protocol: 'http', hostname: '127.0.0.1', port: String(address.port) }],
			});

			assert.equal(redirectRequests, 2);
			assert.equal(imageRequests, 2);
			assert.equal(result.width, 1);
			assert.equal(result.height, 1);
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
	});

	it('does not retry responses without image metadata', async () => {
		let requests = 0;

		const server = createServer((_req, res) => {
			requests++;
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('not image metadata');
		});

		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

		const address = server.address();
		assert.ok(address && typeof address === 'object');

		const origin = `http://127.0.0.1:${address.port}`;

		try {
			await assert.rejects(
				() =>
					inferRemoteSize(`${origin}/not-image.txt`, {
						domains: [],
						remotePatterns: [
							{ protocol: 'http', hostname: '127.0.0.1', port: String(address.port) },
						],
					}),
				{ name: 'NoImageMetadata' },
			);

			assert.equal(requests, 1);
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
	});

	it('stops after the final retry attempt is exhausted', async () => {
		let requests = 0;

		const server = createServer((req) => {
			requests++;
			req.socket.destroy();
		});

		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

		const address = server.address();
		assert.ok(address && typeof address === 'object');

		const origin = `http://127.0.0.1:${address.port}`;

		try {
			await assert.rejects(
				() =>
					inferRemoteSize(`${origin}/image.png`, {
						domains: [],
						remotePatterns: [
							{ protocol: 'http', hostname: '127.0.0.1', port: String(address.port) },
						],
					}),
				(err: unknown) => {
					assert.ok(err instanceof Error);
					assert.equal(err.name, 'FailedToFetchRemoteImageDimensions');
					assert.match(err.message, /after 3 attempts/);
					assert.ok((err as Error & { cause?: unknown }).cause);
					return true;
				},
			);

			assert.equal(requests, 3);
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
	});
});
