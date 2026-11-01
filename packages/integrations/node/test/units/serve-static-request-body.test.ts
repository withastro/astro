import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { createStaticHandler } from '../../dist/serve-static.js';

describe('createStaticHandler request body handling', () => {
	it('does not consume or pull req body stream during static handler matching', async () => {
		const stubApp = {
			removeBase: (p: string) => p,
			match: () => undefined,
			manifest: { trailingSlash: 'ignore' },
		} as any;

		const headersMap = [
			{
				pathname: '/prerendered',
				headers: [{ key: 'X-Test', value: '1' }],
			},
		];

		const serverUrl = pathToFileURL(path.resolve('dist/')).href;
		const clientUrl = pathToFileURL(path.resolve('dist/client/')).href;

		const handler = createStaticHandler(
			stubApp,
			{ port: 0, server: serverUrl, client: clientUrl } as any,
			headersMap,
		);

		const server = http.createServer((req, res) => {
			let iteratorAccessed = false;
			const originalIterator = req[Symbol.asyncIterator];
			Object.defineProperty(req, Symbol.asyncIterator, {
				get() {
					iteratorAccessed = true;
					return originalIterator.bind(req);
				},
				configurable: true,
			});

			handler(req, res, async () => {
				assert.equal(
					iteratorAccessed,
					false,
					'req[Symbol.asyncIterator] should not be read before SSR handler',
				);

				const chunks: Buffer[] = [];
				for await (const chunk of req) {
					chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
				}
				const body = Buffer.concat(chunks).toString('utf8');
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ body }));
			});
		});

		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
		const address = server.address() as { port: number };

		try {
			const res = await fetch(`http://127.0.0.1:${address.port}/echo`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: 'message=hello',
			});
			assert.equal(res.status, 200);
			const data = await res.json();
			assert.equal(data.body, 'message=hello');
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
	});
});
