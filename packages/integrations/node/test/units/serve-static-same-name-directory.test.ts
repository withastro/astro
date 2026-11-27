import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { createStaticHandler } from '../../dist/serve-static.js';

// With `build.format: 'file'` or `'preserve'`, a page and a folder can share a name:
// `blog.html` next to `blog/one.html`.
for (const buildFormat of ['file', 'preserve']) {
	for (const trailingSlash of ['never', 'ignore']) {
		describe(`createStaticHandler, build.format ${buildFormat}, trailingSlash ${trailingSlash}`, () => {
			const clientDir = new URL(`../../dist-client-${buildFormat}-${trailingSlash}/`, import.meta.url);
			let server: http.Server;
			let port: number;

			before(async () => {
				fs.mkdirSync(new URL('blog/', clientDir), { recursive: true });
				fs.writeFileSync(new URL('blog.html', clientDir), 'blog page');
				fs.writeFileSync(new URL('blog/one.html', clientDir), 'blog post');
				fs.writeFileSync(new URL('v1.2.html', clientDir), 'dotted page');
				fs.writeFileSync(new URL('about.html', clientDir), 'about page');
				fs.mkdirSync(new URL('docs/', clientDir), { recursive: true });
				fs.writeFileSync(new URL('docs/index.html', clientDir), 'docs index');

				const app = {
					removeBase: (p: string) => p,
					match: () => undefined,
					manifest: { trailingSlash, buildFormat, assetsDir: '_astro' },
				};
				const handler = createStaticHandler(
					app as any,
					{
						client: clientDir.href,
						server: new URL('../../dist/', import.meta.url).href,
						port: 0,
					} as any,
					undefined,
				);
				server = http.createServer((req, res) =>
					handler(req, res, () => {
						res.statusCode = 404;
						res.end('ssr');
					}),
				);
				await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
				port = (server.address() as AddressInfo).port;
			});

			after(() => {
				server.close();
				fs.rmSync(clientDir, { recursive: true, force: true });
			});

			const get = async (pathname: string) => {
				const res = await fetch(`http://127.0.0.1:${port}${pathname}`);
				return { status: res.status, body: await res.text() };
			};

			it('serves blog.html for /blog', async () => {
				assert.deepEqual(await get('/blog'), { status: 200, body: 'blog page' });
			});

			it('serves a page inside the folder', async () => {
				assert.deepEqual(await get('/blog/one'), { status: 200, body: 'blog post' });
			});

			it('serves a page whose name contains a dot', async () => {
				assert.deepEqual(await get('/v1.2'), { status: 200, body: 'dotted page' });
			});

			it('still serves index.html for a folder that has one', async () => {
				assert.deepEqual(await get('/docs'), { status: 200, body: 'docs index' });
			});

			if (trailingSlash === 'ignore') {
				it('serves the same pages with a trailing slash', async () => {
					assert.deepEqual(await get('/about/'), { status: 200, body: 'about page' });
					assert.deepEqual(await get('/blog/'), { status: 200, body: 'blog page' });
				});
			}
		});
	}
}
