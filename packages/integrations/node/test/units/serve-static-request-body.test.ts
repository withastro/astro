import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { createStaticHandler } from '../../dist/serve-static.js';

describe('createStaticHandler', () => {
	let server: http.Server;
	let port: number;
	let bodyAccessedBeforeSsr: boolean | undefined;

	before(async () => {
		// `resolveClientDir` walks up from `dist/serve-static.js` to the folder named
		// like `options.server`, so point it at `dist/` and use a client folder that
		// doesn't exist: every request falls through to the SSR handler.
		const server_ = new URL('../../dist/', import.meta.url).href;
		const client = new URL('../../dist-client-missing/', import.meta.url).href;
		const app = {
			removeBase: (p: string) => p,
			match: () => undefined,
			manifest: { trailingSlash: 'ignore', buildFormat: 'directory', assetsDir: '_astro' },
		};
		const handler = createStaticHandler(app as any, { client, server: server_, port: 0 } as any, [
			{ pathname: '/one', headers: [{ key: 'X-Test', value: '1' }] },
		]);

		server = http.createServer((req, res) => {
			// Any Request built with `req` as its body reads `req[Symbol.asyncIterator]`,
			// so this records whether the route-matching Request touched the body (#18561).
			let accessed = false;
			const iterator = req[Symbol.asyncIterator];
			Object.defineProperty(req, Symbol.asyncIterator, {
				configurable: true,
				get() {
					accessed = true;
					return iterator;
				},
			});
			handler(req, res, () => {
				bodyAccessedBeforeSsr = accessed;
				res.end();
			});
		});
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		port = (server.address() as AddressInfo).port;
	});

	after(() => {
		server.close();
	});

	it('does not touch the request body when matching routes for static headers', async () => {
		await fetch(`http://127.0.0.1:${port}/echo`, { method: 'POST', body: 'hello' });
		assert.equal(bodyAccessedBeforeSsr, false);
	});
});
