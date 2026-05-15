import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import * as cheerio from 'cheerio';

import { encryptString } from '../dist/core/encryption.js';
import testAdapter from './test-adapter.ts';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

// Helper to create encryption key from test key string
async function createKeyFromString(keyString: string) {
	const binaryString = atob(keyString);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return await crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, [
		'encrypt',
		'decrypt',
	]);
}

// Helper to get encrypted componentExport for 'default'
async function getEncryptedComponentExport(
	keyString = 'eKBaVEuI7YjfanEXHuJe/pwZKKt3LkAHeMxvTU7aR0M=',
	componentId = 'Island',
) {
	const key = await createKeyFromString(keyString);
	return encryptString(key, 'default', `export:${componentId}`);
}

// Helper to get encrypted props
async function getEncryptedProps(
	props: Record<string, unknown> = {},
	keyString = 'eKBaVEuI7YjfanEXHuJe/pwZKKt3LkAHeMxvTU7aR0M=',
	componentId = 'Island',
) {
	const key = await createKeyFromString(keyString);
	return encryptString(key, JSON.stringify(props), `props:${componentId}`);
}

describe('Server islands', () => {
	describe('SSR', () => {
		let fixture: Fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/server-islands/ssr',
				adapter: testAdapter(),
				security: {
					checkOrigin: false,
				},
				outDir: './dist/server-islands-ssr/',
				cacheDir: './node_modules/.astro-test/server-islands-ssr/',
			});
		});

		describe('dev', () => {
			let devServer: DevServer;

			before(async () => {
				process.env.ASTRO_KEY = 'eKBaVEuI7YjfanEXHuJe/pwZKKt3LkAHeMxvTU7aR0M=';
				devServer = await fixture.startDevServer();
			});

			after(async () => {
				await devServer.stop();
				delete process.env.ASTRO_KEY;
			});

			it('HTML escapes scripts', async () => {
				const res = await fixture.fetch('/');
				assert.equal(res.status, 200);
				const html = await res.text();
				assert.equal(html.includes("</script><script>alert('xss')</script><!--"), false);
			});

			it('island can set headers', async () => {
				const encryptedComponentExport = await getEncryptedComponentExport();
				const encryptedProps = await getEncryptedProps();
				const res = await fixture.fetch('/_server-islands/Island', {
					method: 'POST',
					body: JSON.stringify({
						encryptedComponentExport,
						encryptedProps,
						encryptedSlots: '',
					}),
				});
				const works = res.headers.get('X-Works');
				assert.equal(works, 'true', 'able to set header from server island');
			});

			it('supports fragments', async () => {
				const res = await fixture.fetch('/fragment');
				assert.equal(res.status, 200);
				const html = await res.text();
				const fetchMatch = /fetch\('\/_server-islands\/Island\?[^']*p=([^&']*)/.exec(html)!;
				assert.equal(fetchMatch.length, 2, 'should include props in the query string');
				assert.equal(fetchMatch[1], '', 'should not include encrypted empty props');
			});

			it('supports fragments with named slots', async () => {
				const res = await fixture.fetch('/fragment');
				assert.equal(res.status, 200);
				const html = await res.text();
				const fetchMatch = /fetch\('\/_server-islands\/Island\?[^']*p=([^&']*)/.exec(html)!;
				assert.equal(fetchMatch.length, 2, 'should include props in the query string');
				assert.equal(fetchMatch[1], '', 'should not include encrypted empty props');
			});

			it('includes script from slotted component in island response', async () => {
				const res = await fixture.fetch('/slot-with-script');
				assert.equal(res.status, 200);
				const html = await res.text();
				const urlMatch = /fetch\('(\/_server-islands\/Wrapper\?[^']+)'/.exec(html)!;
				assert.ok(urlMatch, 'should have a server island fetch URL');
				const islandRes = await fixture.fetch(urlMatch[1]);
				assert.equal(islandRes.status, 200);
				const islandHtml = await islandRes.text();
				assert.ok(
					islandHtml.includes('<script'),
					'island response should include the script tag from the slotted component',
				);
				assert.ok(
					islandHtml.includes('data-increment'),
					'island response should include the slotted component HTML',
				);
			});
		});

		describe('prod', () => {
			before(async () => {
				process.env.ASTRO_KEY = 'eKBaVEuI7YjfanEXHuJe/pwZKKt3LkAHeMxvTU7aR0M=';
				await fixture.build();
			});

			after(async () => {
				delete process.env.ASTRO_KEY;
			});

			it('omits the islands HTML', async () => {
				const app = await fixture.loadTestAdapterApp();
				const request = new Request('http://example.com/');
				const response = await app.render(request);
				const html = await response.text();

				const $ = cheerio.load(html);
				const serverIslandEl = $('h2#island');
				assert.equal(serverIslandEl.length, 0);

				const serverIslandScript = $('script[data-island-id]');
				assert.equal(serverIslandScript.length, 1, 'has the island script');
			});

			it('island is not indexed', async () => {
				const app = await fixture.loadTestAdapterApp();
				const encryptedComponentExport = await getEncryptedComponentExport();
				const encryptedProps = await getEncryptedProps();
				const request = new Request('http://example.com/_server-islands/Island', {
					method: 'POST',
					body: JSON.stringify({
						encryptedComponentExport,
						encryptedProps,
						encryptedSlots: '',
					}),
					headers: {
						origin: 'http://example.com',
					},
				});
				const response = await app.render(request);
				assert.equal(response.headers.get('x-robots-tag'), 'noindex');
			});
			it('rejects invalid props', async () => {
				const app = await fixture.loadTestAdapterApp();
				const encryptedComponentExport = await getEncryptedComponentExport();
				const request = new Request('http://example.com/_server-islands/Island', {
					method: 'POST',
					body: JSON.stringify({
						encryptedComponentExport,
						// not the expected value:
						encryptedProps: 'FC8337AF072BE5B1641501E1r8mLIhmIME1AV7UO9XmW9OLE',
						encryptedSlots: '',
					}),
					headers: {
						origin: 'http://example.com',
					},
				});
				const response = await app.render(request);
				assert.equal(response.status, 400);
			});

			it('accepts encrypted slots via POST', async () => {
				const app = await fixture.loadTestAdapterApp();
				const key = await createKeyFromString('eKBaVEuI7YjfanEXHuJe/pwZKKt3LkAHeMxvTU7aR0M=');
				const encryptedComponentExport = await encryptString(key, 'default', 'export:Island');
				const encryptedProps = await getEncryptedProps();
				const slotsToEncrypt = { content: '<p>Safe slot content</p>' };
				const encryptedSlots = await encryptString(
					key,
					JSON.stringify(slotsToEncrypt),
					'slots:Island',
				);

				const request = new Request('http://example.com/_server-islands/Island', {
					method: 'POST',
					body: JSON.stringify({
						encryptedComponentExport,
						encryptedProps,
						encryptedSlots: encryptedSlots,
					}),
					headers: {
						origin: 'http://example.com',
					},
				});
				const response = await app.render(request);
				assert.equal(response.status, 200, 'should accept encrypted slots');
			});

			it('rejects invalid encrypted slots via POST', async () => {
				const app = await fixture.loadTestAdapterApp();
				const encryptedComponentExport = await getEncryptedComponentExport();
				const encryptedProps = await getEncryptedProps();

				const request = new Request('http://example.com/_server-islands/Island', {
					method: 'POST',
					body: JSON.stringify({
						encryptedComponentExport,
						encryptedProps,
						// hard-coded invalid encrypted slot value:
						encryptedSlots: 'FC8337AF072BE5B1641501E1r8mLIhmIME1AV7UO9XmW9OLE',
					}),
					headers: {
						origin: 'http://example.com',
					},
				});
				const response = await app.render(request);
				assert.equal(response.status, 400, 'should reject invalid encrypted slots');
			});

			it('accepts encrypted slots with XSS payload via POST', async () => {
				const app = await fixture.loadTestAdapterApp();
				const key = await createKeyFromString('eKBaVEuI7YjfanEXHuJe/pwZKKt3LkAHeMxvTU7aR0M=');
				const encryptedComponentExport = await encryptString(key, 'default', 'export:Island');
				const encryptedProps = await getEncryptedProps();
				const slotsToEncrypt = { xss: '<img src=x onerror=alert(0)>' };
				const encryptedSlots = await encryptString(
					key,
					JSON.stringify(slotsToEncrypt),
					'slots:Island',
				);

				const request = new Request('http://example.com/_server-islands/Island', {
					method: 'POST',
					body: JSON.stringify({
						encryptedComponentExport,
						encryptedProps,
						encryptedSlots: encryptedSlots,
					}),
					headers: {
						origin: 'http://example.com',
					},
				});
				const response = await app.render(request);
				assert.equal(
					response.status,
					200,
					'should accept even XSS in encrypted slots (safe when encrypted)',
				);
			});

			it('supports mdx', async () => {
				const app = await fixture.loadTestAdapterApp();
				const request = new Request('http://example.com/test/');
				const res = await app.render(request);
				assert.equal(res.status, 200);
				const html = await res.text();
				const fetchMatch = /fetch\('\/_server-islands\/Island\?[^']*p=([^&']*)/.exec(html)!;
				assert.equal(fetchMatch.length, 2, 'should include props in the query string');
				assert.equal(fetchMatch[1], '', 'should not include encrypted empty props');
			});
		});
	});

	describe('Hybrid mode', () => {
		let fixture: Fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/server-islands/hybrid',
				outDir: './dist/server-islands-hybrid-mode/',
				cacheDir: './node_modules/.astro-test/server-islands-hybrid-mode/',
			});
		});

		describe('build', () => {
			before(async () => {
				await fixture.build({
					adapter: testAdapter(),
				});
			});

			it('Omits the island HTML from the static HTML', async () => {
				let html = await fixture.readFile('/client/index.html');

				const $ = cheerio.load(html);
				const serverIslandEl = $('h2#island');
				assert.equal(serverIslandEl.length, 0);

				const serverIslandScript = $('script[data-island-id]');
				assert.equal(serverIslandScript.length, 2, 'has the island script');
			});

			it('includes the server island runtime script once', async () => {
				let html = await fixture.readFile('/client/index.html');

				const $ = cheerio.load(html);
				const serverIslandScript = $('script').filter((_, el) =>
					($(el).html() ?? '').trim().startsWith('async function replaceServerIsland'),
				);
				assert.equal(
					serverIslandScript.length,
					1,
					'should include the server island runtime script once',
				);
			});
		});

		it('can fetch the server island endpoint in dev with adapter that does not set buildOutput', async () => {
			// Use an adapter that does NOT set adapterFeatures.buildOutput,
			// like @astrojs/netlify. This triggers the bug in container.ts where
			// buildOutput is reset to 'static' after runHookConfigDone sets it to 'server'.
			const devFixture = await loadFixture({
				root: './fixtures/server-islands/hybrid',
				adapter: testAdapter({
					extendAdapter: {
						adapterFeatures: {},
					},
				}),
				outDir: './dist/server-islands-build/',
				cacheDir: './node_modules/.astro-test/server-islands-build/',
			});
			const devServer = await devFixture.startDevServer();
			try {
				const res = await devFixture.fetch('/');
				assert.equal(res.status, 200);
				const html = await res.text();
				const fetchMatch = /fetch\('(\/_server-islands\/Island[^']*)/.exec(html)!;
				assert.ok(fetchMatch, 'should have a server island fetch URL');
				const islandRes = await devFixture.fetch(fetchMatch[1]);
				assert.equal(
					islandRes.status,
					200,
					'server island endpoint should return 200, not GetStaticPathsRequired error',
				);
			} finally {
				await devServer.stop();
			}
		});

		describe('with no adapter', () => {
			let devServer: DevServer;

			it('Errors during the build', async () => {
				try {
					await fixture.build({
						adapter: undefined,
					});
					assert.equal(true, false, 'should not have succeeded');
				} catch (err) {
					assert.equal(
						(err as { title: string }).title,
						'Cannot use Server Islands without an adapter.',
					);
				}
			});

			it('Errors during dev', async () => {
				devServer = await fixture.startDevServer();
				const res = await fixture.fetch('/');
				assert.equal(res.status, 500);
				const html = await res.text();
				const $ = cheerio.load(html);
				assert.equal($('title').text(), 'NoAdapterInstalledServerIslands');
			});
			after(() => {
				return devServer?.stop();
			});
		});
	});
});
