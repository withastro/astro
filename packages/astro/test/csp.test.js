import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
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
			for (const hash of manifest.csp.styleHashes) {
				assert.ok(meta.attr('content').includes(hash), `Should have a CSP meta tag for ${hash}`);
			}
		} else {
			assert.fail('Should have the manifest');
		}
	});

	it('should contain the meta script hashes when using client island', async () => {
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
			for (const hash of manifest.csp.scriptHashes) {
				assert.ok(meta.attr('content').includes(hash), `Should have a CSP meta tag for ${hash}`);
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

		const request = new Request('http://example.com/index.html');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		assert.ok(meta.attr('content').toString().includes('sha512-'));
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

		const request = new Request('http://example.com/index.html');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		assert.ok(meta.attr('content').toString().includes('sha384-'));
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
					styleDirective: {
						hashes: ['sha512-hash1', 'sha384-hash2'],
					},
					scriptDirective: {
						hashes: ['sha512-hash3', 'sha384-hash4'],
					},
				},
			},
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();

		const request = new Request('http://example.com/index.html');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		assert.ok(meta.attr('content').toString().includes('sha384-hash2'));
		assert.ok(meta.attr('content').toString().includes('sha384-hash4'));
		assert.ok(meta.attr('content').toString().includes('sha512-hash1'));
		assert.ok(meta.attr('content').toString().includes('sha512-hash3'));
	});

	it('should contain the additional directives', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
			adapter: testAdapter({
				setManifest(_manifest) {
					manifest = _manifest;
				},
			}),
			experimental: {
				csp: {
					directives: ["img-src 'self' 'https://example.com'"],
				},
			},
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();

		const request = new Request('http://example.com/index.html');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		assert.ok(meta.attr('content').toString().includes("img-src 'self' 'https://example.com'"));
	});

	it('should contain the custom resources for "script-src" and "style-src"', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
			adapter: testAdapter({
				setManifest(_manifest) {
					manifest = _manifest;
				},
			}),
			experimental: {
				csp: {
					styleDirective: {
						resources: ['https://cdn.example.com', 'https://styles.cdn.example.com'],
					},
					scriptDirective: {
						resources: ['https://cdn.example.com', 'https://scripts.cdn.example.com'],
					},
				},
			},
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();

		const request = new Request('http://example.com/index.html');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		assert.ok(
			meta
				.attr('content')
				.toString()
				.includes("script-src 'https://cdn.example.com' 'https://scripts.cdn.example.com'"),
		);
		assert.ok(
			meta
				.attr('content')
				.toString()
				.includes("style-src 'https://cdn.example.com' 'https://styles.cdn.example.com'"),
		);
	});

	it('allows injecting custom script resources and hashes based on pages', async () => {
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

		const request = new Request('http://example.com/scripts/index.html');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		// correctness for resources
		assert.ok(
			meta.attr('content').toString().includes("script-src 'https://scripts.cdn.example.com'"),
		);
		assert.ok(meta.attr('content').toString().includes("style-src 'self'"));
		// correctness for hashes
		assert.ok(meta.attr('content').toString().includes("default-src 'self';"));
	});

	it('allows injecting custom styles resources and hashes based on pages', async () => {
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

		const request = new Request('http://example.com/styles/index.html');
		const response = await app.render(request);
		const html = await response.text();
		console.log(html);
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		// correctness for resources
		assert.ok(
			meta.attr('content').toString().includes("style-src 'https://styles.cdn.example.com'"),
		);
		assert.ok(meta.attr('content').toString().includes("script-src 'self'"));
		// correctness for hashes
		assert.ok(meta.attr('content').toString().includes("default-src 'self';"));
	});
});
