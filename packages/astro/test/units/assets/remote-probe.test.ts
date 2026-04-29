import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { inferRemoteSize } from '../../../dist/assets/utils/remoteProbe.js';

const FIXTURE_IMAGE = new URL('./600x400.jpg', import.meta.url);

describe('inferRemoteSize remotePatterns.followRedirects', () => {
	let server: Server;
	let imageBuffer: Buffer;
	let baseURL: URL;

	before(async () => {
		imageBuffer = await readFile(FIXTURE_IMAGE);
		server = createServer((req, res) => {
			if (!req.url) {
				res.writeHead(400);
				res.end();
				return;
			}

			if (req.url === '/image.jpg') {
				res.writeHead(200, { 'Content-Type': 'image/jpeg' });
				res.end(imageBuffer);
				return;
			}

			if (req.url === '/redirect') {
				res.writeHead(302, { Location: '/image.jpg' });
				res.end();
				return;
			}

			res.writeHead(404);
			res.end();
		});

		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
		const address = server.address();
		assert.ok(address && typeof address === 'object');
		baseURL = new URL(`http://127.0.0.1:${address.port}`);
	});

	after(async () => {
		await new Promise<void>((resolve, reject) => {
			server.close((error) => (error ? reject(error) : resolve()));
		});
	});

	it('throws for redirect responses when followRedirects is not enabled', async () => {
		await assert.rejects(
			() =>
				inferRemoteSize(new URL('/redirect', baseURL).toString(), {
					domains: [],
					remotePatterns: [{ hostname: '127.0.0.1' }],
				}),
			/Failed to get the dimensions/,
		);
	});

	it('follows redirects when remote pattern enables followRedirects', async () => {
		const result = await inferRemoteSize(new URL('/redirect', baseURL).toString(), {
			domains: [],
			remotePatterns: [{ hostname: '127.0.0.1', followRedirects: true }],
		});

		assert.equal(result.width, 600);
		assert.equal(result.height, 400);
	});
});
