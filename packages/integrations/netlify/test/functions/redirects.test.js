import * as assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from '../../../../astro/test/test-utils.js';
import { readFile } from 'node:fs/promises';

describe(
	'SSR - Redirects',
	() => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({ root: new URL('./fixtures/redirects/', import.meta.url) });
			await fixture.build();
		});

		it('Creates a redirects file', async () => {
			const redirects = await fixture.readFile('./_redirects');
			const parts = redirects.split(/\s+/);
			assert.deepEqual(parts, ['', '/other', '/', '301', '']);
			// Snapshots are not supported in Node.js test yet (https://github.com/nodejs/node/issues/48260)
			assert.equal(redirects, '\n/other    /       301\n');
		});

		it('Does not create .html files', async () => {
			let hasErrored = false;
			try {
				await fixture.readFile('/other/index.html');
			} catch {
				hasErrored = true;
			}
			assert.equal(hasErrored, true, 'this file should not exist');
		});

		describe('renders static 404 page', () => {
			let testServer;

			before(() => {
				testServer = createServer(async (req, res) => {
					if (req.url === '/404.html') {
						res.writeHead(200);
						const content = await readFile(
							new URL('./fixtures/redirects/dist/404.html', import.meta.url),
						);
						res.write(content);
					} else {
						res.writeHead(404);
					}
					res.end();
				});
				testServer.listen(5678);
			});

			after(() => {
				testServer.close();
			});

			it('works', async () => {
				const entryURL = new URL(
					'./fixtures/redirects/.netlify/v1/functions/ssr/packages/integrations/netlify/test/functions/fixtures/redirects/.netlify/build/ssr-function.mjs',
					import.meta.url,
				);
				const { default: handler } = await import(entryURL);
				const resp = await handler(new Request('http://localhost:5678/nonexistant-page'), {});
				assert.equal(resp.status, 404);
				assert.equal(resp.headers.get('content-type'), 'text/html; charset=utf-8');
				const text = await resp.text();
				assert.equal(text.includes('This is my static 404 page'), true);
			});
		});
	},
	{
		timeout: 120000,
	},
);
