import assert from 'node:assert/strict';
import {  describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('CSP', () => {
	let app;
	/**
	 * @type {import('../dist/core/build/types.js').SSGManifest}
	 */
	let manifest;
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	it('should contain the meta style hashes when CSS is imported from Astro component', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
			adapter: testAdapter({
				setManifest(_manifest) {
					manifest = _manifest;
				},
			}),
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
		if (manifest) {
			const request = new Request('http://example.com/index.html');
			const response = await app.render(request);
			const $ = cheerio.load(await response.text());

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			for (const hash of manifest.csp.clientStyleHashes) {
				assert.match(
					meta.attr('content'),
					new RegExp(`'${hash}'`),
					`Should have a CSP meta tag for ${hash}`,
				);
			}
		} else {
			assert.fail('Should have the manifest');
		}
	});
	it('should generate the hash with the sha512 algorithm', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
			adapter: testAdapter({
				setManifest(_manifest) {
					manifest = _manifest;
				},
			}),
			experimental: {
				csp: {
					algorithm: 'SHA-512',
				},
			},
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();

		if (manifest) {
			const request = new Request('http://example.com/index.html');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			assert.ok(meta.attr('content').toString().includes('sha512-'));
		} else {
			assert.fail('Should have the manifest');
		}
	});

	it('should generate the hash with the sha384 algorithm', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
			adapter: testAdapter({
				setManifest(_manifest) {
					manifest = _manifest;
				},
			}),
			experimental: {
				csp: {
					algorithm: 'SHA-384',
				},
			},
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();

		if (manifest) {
			const request = new Request('http://example.com/index.html');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			assert.ok(meta.attr('content').toString().includes('sha384-'));
		} else {
			assert.fail('Should have the manifest');
		}
	});

	it('should render hashes provided by the user', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
			adapter: testAdapter({
				setManifest(_manifest) {
					manifest = _manifest;
				},
			}),
			experimental: {
				csp: {
					styleHashes: ['sha512-hash1', 'sha384-hash2'],
					scriptHashes: ['sha512-hash3', 'sha384-hash4'],
				},
			},
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();

		if (manifest) {
			const request = new Request('http://example.com/index.html');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			assert.ok(meta.attr('content').toString().includes('sha384-hash2'));
			assert.ok(meta.attr('content').toString().includes('sha384-hash4'));
			assert.ok(meta.attr('content').toString().includes('sha512-hash1'));
			assert.ok(meta.attr('content').toString().includes('sha512-hash3'));
		} else {
			assert.fail('Should have the manifest');
		}
	});
	//
	// it.skip('should contain the additional directives', async () => {
	// 	fixture = await loadFixture({
	// 		root: './fixtures/csp/',
	// 		adapter: testAdapter({
	// 			setManifest(_manifest) {
	// 				manifest = _manifest;
	// 			},
	// 		}),
	// 		experimental: {
	// 			csp: {
	// 				directives: ["image-src: 'self' 'https://example.com'"],
	// 			},
	// 		},
	// 	});
	// 	await fixture.build();
	// 	app = await fixture.loadTestAdapterApp();
	//
	// 	if (manifest) {
	// 		const request = new Request('http://example.com/index.html');
	// 		const response = await app.render(request);
	// 		const html = await response.text();
	// 		const $ = cheerio.load(html);
	//
	// 		const meta = $('meta[http-equiv="Content-Security-Policy"]');
	// 		assert.ok(
	// 			meta.attr('content').toString().includes("image-src: 'self' 'https://example.com'"),
	// 		);
	// 	} else {
	// 		assert.fail('Should have the manifest');
	// 	}
	// });
});
