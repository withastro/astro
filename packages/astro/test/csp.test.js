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
			const html = await response.text();
			const $ = cheerio.load(html);

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
			experimental: {
				csp: {
					algorithm: 'SHA-512',
				},
			},
		});
		await fixture.build();
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		assert.ok(meta.attr('content').toString().includes('sha512-'));
	});

	it('should generate the hash with the sha384 algorithm', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
			experimental: {
				csp: {
					algorithm: 'SHA-384',
				},
			},
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		assert.ok(meta.attr('content').toString().includes('sha384-'));
	});

	it('should render hashes provided by the user', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
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

		const html = await fixture.readFile('/index.html');
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
			experimental: {
				csp: {
					directives: ["img-src 'self' 'https://example.com'"],
				},
			},
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		assert.ok(meta.attr('content').toString().includes("img-src 'self' 'https://example.com'"));
	});

	it('should contain the custom resources for "script-src" and "style-src"', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
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

		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		assert.ok(
			meta
				.attr('content')
				.toString()
				.includes('script-src https://cdn.example.com https://scripts.cdn.example.com'),
		);
		assert.ok(
			meta
				.attr('content')
				.toString()
				.includes('style-src https://cdn.example.com https://styles.cdn.example.com'),
		);
	});

	it('allows injecting custom script resources and hashes based on pages', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
		});
		await fixture.build();

		const html = await fixture.readFile('/scripts/index.html');
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		// correctness for resources
		assert.ok(
			meta.attr('content').toString().includes('script-src https://scripts.cdn.example.com'),
		);
		assert.ok(meta.attr('content').toString().includes("style-src 'self'"));
		// correctness for hashes
		assert.ok(meta.attr('content').toString().includes("default-src 'self';"));
	});

	it('allows injecting custom styles resources and hashes based on pages', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
		});
		await fixture.build();
		const html = await fixture.readFile('/styles/index.html');
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		// correctness for resources
		assert.ok(meta.attr('content').toString().includes('style-src https://styles.cdn.example.com'));
		assert.ok(meta.attr('content').toString().includes("script-src 'self'"));
		// correctness for hashes
		assert.ok(meta.attr('content').toString().includes("default-src 'self';"));
	});

	it('allows add `strict-dynamic` when enabled', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
			experimental: {
				csp: {
					scriptDirective: {
						strictDynamic: true,
					},
				},
			},
		});
		await fixture.build();
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		assert.ok(meta.attr('content').toString().includes("'strict-dynamic';"));
	});

	it("allows the use of directives that don't require values, and deprecated ones", async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
			experimental: {
				csp: {
					directives: [
						'upgrade-insecure-requests',
						'sandbox',
						'trusted-types',
						'report-uri https://endpoint.example.com',
					],
				},
			},
		});
		await fixture.build();
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		assert.ok(meta.attr('content').toString().includes('upgrade-insecure-requests'));
		assert.ok(meta.attr('content').toString().includes('sandbox'));
		assert.ok(meta.attr('content').toString().includes('trusted-types'));
		assert.ok(meta.attr('content').toString().includes('report-uri https://endpoint.example.com'));
	});

	it('should serve hashes via headers for dynamic pages, when the strategy is "auto"', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp-adapter/',
			adapter: testAdapter(),
			experimental: {
				csp: true,
			},
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();

		const request = new Request('http://example.com/ssr');
		const response = await app.render(request);

		const header = response.headers.get('content-security-policy');

		// correctness for resources
		assert.ok(header.includes('style-src https://styles.cdn.example.com'));
		assert.ok(header.includes("script-src 'self'"));
		// correctness for hashes
		assert.ok(header.includes("default-src 'self';"));

		const html = await response.text();
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		assert.equal(meta.attr('content'), undefined, 'meta tag should not be present');
	});

	it('should generate hashes for inline styles', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
		});
		await fixture.build();
		const html = await fixture.readFile('/inline/index.html');
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		// hash of the <style> content
		assert.ok(
			meta
				.attr('content')
				.toString()
				.includes("'sha256-fP5hIETY85LoQH4mfn28a0KQgRZ3ZBI/WJOYJRKChes='"),
		);
	});

	it('should generate hashes and directives for fonts', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp-fonts/',
		});
		await fixture.build();
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		/**
		 *
		 * @param {string} csp
		 * @returns {Array<{ directive: string; resources: Array<string> }>}
		 */
		function parseCsp(csp) {
			return csp
				.split(';')
				.map((part) => part.trim())
				.filter((part) => part.length > 0)
				.map((part) => {
					const [directive, ...resources] = part.split(/\s+/);
					return {
						directive,
						resources,
					};
				});
		}

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		const parsed = parseCsp(meta.attr('content').toString());
		assert.ok(
			parsed.find((e) => e.directive === 'style-src')?.resources.length === 2,
			'Style hash is not injected by vite-plugin-fonts',
		);
		assert.deepStrictEqual(parsed.find((e) => e.directive === 'font-src')?.resources, [
			"'self'",
			'https://fonts.cdn.test.com',
		]);
	});

	it('should not inject self by default if fonts are not used', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
		});
		await fixture.build();
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		assert.equal(meta.attr('content').toString().includes('font-src'), false);
	});

	it('should return CSP header inside a hook', async () => {
		let routeToHeaders;
		fixture = await loadFixture({
			root: './fixtures/csp-adapter/',
			adapter: testAdapter({
				staticHeaders: true,
				setRouteToHeaders(payload) {
					routeToHeaders = payload;
				},
			}),
			experimental: {
				csp: true,
			},
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();

		assert.equal(routeToHeaders.size, 4, 'expected four routes: /, /scripts, /foo, /bar');

		assert.ok(routeToHeaders.has('/'), 'should have a CSP header for /');
		assert.ok(routeToHeaders.has('/scripts'), 'should have a CSP header for /scripts');
		assert.ok(routeToHeaders.has('/foo'), 'should have a CSP header for /foo');
		assert.ok(routeToHeaders.has('/bar'), 'should have a CSP header for /bar');

		for (const { headers } of routeToHeaders.values()) {
			assert.ok(headers.has('content-security-policy'), 'should have a CSP header');
		}
	});
});
