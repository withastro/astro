import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { load as cheerioLoad } from 'cheerio';
import partytown from '@astrojs/partytown';
import { viteID } from '../dist/core/util.js';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

const root = './fixtures/mega-ssr/';

function createBaseConfig(outDir) {
	return {
		root,
		output: 'server',
		adapter: testAdapter(),
		outDir,
	};
}

async function fetchHTML(fixture, path) {
	const app = await fixture.loadTestAdapterApp();
	const request = new Request('http://example.com' + path);
	const response = await app.render(request);
	return await response.text();
}

describe('SSR response headers', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture(createBaseConfig('./dist/ssr-core/response'));
		await fixture.build();
	});

	it('Can set the status', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/status-code');
		const response = await app.render(request);
		assert.equal(response.status, 404);
	});

	it('Can set the statusText', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/status-code');
		const response = await app.render(request);
		assert.equal(response.statusText, 'Oops');
	});

	it('Can set headers for 404 page', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/status-code');
		const response = await app.render(request);
		assert.equal(response.headers.get('one-two'), 'three');
	});

	it('Returns the page, not the custom 404', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/status-code');
		const response = await app.render(request);
		const html = await response.text();
		assert.equal(html.includes('<h1>Testing</h1>'), true);
		assert.equal(html.includes('Something went horribly wrong!'), false);
	});

	it('Can add headers', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/some-header');
		const response = await app.render(request);
		const headers = response.headers;
		assert.equal(headers.get('one-two'), 'three');
		assert.equal(headers.get('four-five'), 'six');
		assert.equal(headers.get('Cache-Control'), 'max-age=0, s-maxage=86400');
	});
});

describe('Redirecting trailing slashes in SSR', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	describe('trailingSlash: always', () => {
		before(async () => {
			fixture = await loadFixture({
				...createBaseConfig('./dist/ssr-core/trailing-always'),
				trailingSlash: 'always',
			});
			await fixture.build();
		});

		it('Redirects to add a trailing slash', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another/');
		});

		it('Redirects to collapse multiple trailing slashes', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another///');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another/');
		});

		it('Redirects to collapse multiple trailing slashes with query param', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another///?hello=world');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another/?hello=world');
		});

		it('Does not redirect to collapse multiple internal slashes', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another///path/');
			const response = await app.render(request);
			assert.equal(response.status, 404);
		});

		it('Does not redirect trailing slashes on query params', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another/?hello=world///');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Does not redirect when trailing slash is present', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another/');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Redirects with query params', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another?foo=bar');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another/?foo=bar');
		});

		it('Does not redirect with query params when trailing slash is present', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another/?foo=bar');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Redirects subdirectories to add a trailing slash', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/sub/path');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/sub/path/');
		});

		it('Does not redirect requests for files', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/favicon.ico');
			const response = await app.render(request);
			assert.equal(response.status, 404);
		});

		it('Does not redirect requests for files in subdirectories', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/sub/favicon.ico');
			const response = await app.render(request);
			assert.equal(response.status, 404);
		});

		it('Does redirect if the dot is in a directory name', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/dot.in.directory/path');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/dot.in.directory/path/');
		});

		it('Does not redirect internal paths', async () => {
			const app = await fixture.loadTestAdapterApp();

			for (const path of [
				'/_astro/something',
				'/_image?url=http://example.com/foo.jpg',
				'/_server-islands/foo',
				'/_actions/foo',
				'/.netlify/image?url=http://example.com/foo.jpg',
				'//target.example/path',
			]) {
				const request = new Request(`http://example.com${path}`);
				const response = await app.render(request);
				assert.notEqual(response.status, 301);
			}
		});

		it('Redirects POST requests', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another', { method: 'POST' });
			const response = await app.render(request);
			assert.equal(response.status, 308);
			assert.equal(response.headers.get('Location'), '/another/');
		});
	});

	describe('trailingSlash: never', () => {
		before(async () => {
			fixture = await loadFixture({
				...createBaseConfig('./dist/ssr-core/trailing-never'),
				trailingSlash: 'never',
			});
			await fixture.build();
		});

		it('Redirects to remove a trailing slash', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another/');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another');
		});

		it('Redirects to collapse multiple trailing slashes', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another///');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another');
		});

		it('Does not redirect when trailing slash is absent', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Redirects with query params', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another/?foo=bar');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another?foo=bar');
		});

		it('Does not redirect with query params when trailing slash is absent', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another?foo=bar');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it("Does not redirect when there's a slash at the end of query params", async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another?foo=bar/');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Redirects subdirectories to remove a trailing slash', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/sub/path/');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/sub/path');
		});

		it("Redirects even if there's a dot in the directory name", async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/favicon.ico/');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/favicon.ico');
		});

		it('Does not redirect internal paths', async () => {
			const app = await fixture.loadTestAdapterApp();

			for (const path of [
				'/_astro/something/',
				'/_image/?url=http://example.com/foo.jpg',
				'/_server-islands/foo/',
				'/_actions/foo/',
				'/.netlify/image/?url=http://example.com/foo.jpg',
				'//target.example/path/',
			]) {
				const request = new Request(`http://example.com${path}/`);
				const response = await app.render(request);
				assert.notEqual(response.status, 301);
			}
		});

		it('Redirects POST requests', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another/', { method: 'POST' });
			const response = await app.render(request);
			assert.equal(response.status, 308);
			assert.equal(response.headers.get('Location'), '/another');
		});
	});

	describe('trailingSlash: never with base path', () => {
		before(async () => {
			fixture = await loadFixture({
				...createBaseConfig('./dist/ssr-core/trailing-never-base'),
				trailingSlash: 'never',
				base: '/mybase',
			});
			await fixture.build();
		});

		it('Redirects to remove a trailing slash on base path', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/mybase/');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/mybase');
		});

		it('Does not redirect when base path has no trailing slash', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/mybase');
			const response = await app.render(request);
			assert.notEqual(response.status, 301);
			assert.notEqual(response.status, 308);
		});

		it('Redirects to remove trailing slash on sub-paths with base', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/mybase/another/');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/mybase/another');
		});

		it('Does not redirect sub-paths without trailing slash with base', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/mybase/another');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});
	});

	describe('trailingSlash: ignore', () => {
		before(async () => {
			fixture = await loadFixture({
				...createBaseConfig('./dist/ssr-core/trailing-ignore'),
				trailingSlash: 'ignore',
			});
			await fixture.build();
		});

		it('Redirects to collapse multiple trailing slashes', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another///');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another/');
		});

		it('Does not redirect when trailing slash is absent', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Does not redirect when trailing slash is present', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another/');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Does not redirect internal paths', async () => {
			const app = await fixture.loadTestAdapterApp();

			for (const path of [
				'/_astro/something//',
				'/_image//?url=http://example.com/foo.jpg',
				'/_server-islands/foo//',
				'/_actions/foo//',
				'/.netlify/image//?url=http://example.com/foo.jpg',
				'//target.example/path//',
			]) {
				const request = new Request(`http://example.com${path}/`);
				const response = await app.render(request);
				assert.notEqual(response.status, 301);
			}
		});
	});
});

describe('SSR scripts in build output', () => {
	const defaultFixtureOptions = {
		root,
		output: 'server',
		adapter: testAdapter(),
	};

	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	describe('inline scripts', () => {
		before(async () => {
			fixture = await loadFixture({
				...defaultFixtureOptions,
				outDir: './dist/ssr-core/inline-scripts',
			});
			await fixture.build();
		});

		it('scripts get included', async () => {
			const html = await fetchHTML(fixture, '/');
			const $ = cheerioLoad(html);
			assert.equal($('script').length, 1);
		});
	});

	describe('inline scripts with base path', () => {
		const base = '/hello';

		before(async () => {
			fixture = await loadFixture({
				...defaultFixtureOptions,
				outDir: './dist/ssr-core/inline-scripts-base',
				base,
			});
			await fixture.build();
		});

		it('Inlined scripts get included without base path in the script', async () => {
			const html = await fetchHTML(fixture, '/hello/');
			const $ = cheerioLoad(html);
			assert.equal($('script').html(), "console.log('hello world');");
		});
	});

	describe('external scripts with assetsInlineLimit: 0', () => {
		before(async () => {
			fixture = await loadFixture({
				...defaultFixtureOptions,
				outDir: './dist/ssr-core/external-scripts',
				vite: {
					build: {
						assetsInlineLimit: 0,
					},
				},
			});
			await fixture.build();
		});

		it('script has correct path', async () => {
			const html = await fetchHTML(fixture, '/');
			const $ = cheerioLoad(html);
			assert.match($('script').attr('src'), /^\/_astro\/.*\.js$/);
		});
	});

	describe('external scripts with base path', () => {
		before(async () => {
			fixture = await loadFixture({
				...defaultFixtureOptions,
				outDir: './dist/ssr-core/external-scripts-base',
				vite: {
					build: {
						assetsInlineLimit: 0,
					},
				},
				base: '/hello',
			});
			await fixture.build();
		});

		it('script has correct path', async () => {
			const html = await fetchHTML(fixture, '/hello/');
			const $ = cheerioLoad(html);
			assert.match($('script').attr('src'), /^\/hello\/_astro\/.*\.js$/);
		});
	});

	describe('external scripts with assetsPrefix', () => {
		before(async () => {
			fixture = await loadFixture({
				...defaultFixtureOptions,
				outDir: './dist/ssr-core/external-scripts-assets-prefix',
				build: {
					assetsPrefix: 'https://cdn.example.com',
				},
				vite: {
					build: {
						assetsInlineLimit: 0,
					},
				},
			});
			await fixture.build();
		});

		it('script has correct path', async () => {
			const html = await fetchHTML(fixture, '/');
			const $ = cheerioLoad(html);
			assert.match($('script').attr('src'), /^https:\/\/cdn\.example\.com\/_astro\/.*\.js$/);
		});
	});

	describe('external scripts with custom rollup output file names', () => {
		before(async () => {
			fixture = await loadFixture({
				...defaultFixtureOptions,
				outDir: './dist/ssr-core/rollup-output',
				vite: {
					build: {
						assetsInlineLimit: 0,
					},
					environments: {
						client: {
							build: {
								rollupOptions: {
									output: {
										entryFileNames: 'assets/entry.[hash].mjs',
										chunkFileNames: 'assets/chunks/chunk.[hash].mjs',
										assetFileNames: 'assets/asset.[hash][extname]',
									},
								},
							},
						},
					},
				},
			});
			await fixture.build();
		});

		it('script has correct path', async () => {
			const html = await fetchHTML(fixture, '/');
			const $ = cheerioLoad(html);
			assert.match($('script').attr('src'), /^\/assets\/entry\..{8}\.mjs$/);
		});
	});

	describe('external scripts with custom rollup output file names and base', () => {
		before(async () => {
			fixture = await loadFixture({
				...defaultFixtureOptions,
				outDir: './dist/ssr-core/rollup-output-base',
				vite: {
					build: {
						assetsInlineLimit: 0,
					},
					environments: {
						client: {
							build: {
								rollupOptions: {
									output: {
										entryFileNames: 'assets/entry.[hash].mjs',
										chunkFileNames: 'assets/chunks/chunk.[hash].mjs',
										assetFileNames: 'assets/asset.[hash][extname]',
									},
								},
							},
						},
					},
				},
				base: '/hello',
			});
			await fixture.build();
		});

		it('script has correct path', async () => {
			const html = await fetchHTML(fixture, '/hello/');
			const $ = cheerioLoad(html);
			assert.match($('script').attr('src'), /^\/hello\/assets\/entry\..{8}\.mjs$/);
		});
	});

	describe('external scripts with custom rollup output file names and assetsPrefix', () => {
		before(async () => {
			fixture = await loadFixture({
				...defaultFixtureOptions,
				outDir: './dist/ssr-core/rollup-output-assets-prefix',
				build: {
					assetsPrefix: 'https://cdn.example.com',
				},
				vite: {
					build: {
						assetsInlineLimit: 0,
					},
					environments: {
						client: {
							build: {
								rollupOptions: {
									output: {
										entryFileNames: 'assets/entry.[hash].mjs',
										chunkFileNames: 'assets/chunks/chunk.[hash].mjs',
										assetFileNames: 'assets/asset.[hash][extname]',
									},
								},
							},
						},
					},
				},
			});
			await fixture.build();
		});

		it('script has correct path', async () => {
			const html = await fetchHTML(fixture, '/');
			const $ = cheerioLoad(html);
			assert.match(
				$('script').attr('src'),
				/^https:\/\/cdn\.example\.com\/assets\/entry\..{8}\.mjs$/,
			);
		});
	});
});

describe('SSR hydrated component scripts', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture(createBaseConfig('./dist/ssr-core/hydrated-scripts'));
		await fixture.build();
	});

	it('Are included in the manifest.assets so that an adapter can know to serve static', async () => {
		const app = await fixture.loadTestAdapterApp();
		const assets = app.manifest.assets;
		assert.ok(assets.size > 0);
	});
});

describe('SSR environment variables', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture(createBaseConfig('./dist/ssr-core/env'));
		await fixture.build();
	});

	it('import.meta.env.SSR is true', async () => {
		const html = await fetchHTML(fixture, '/ssr');
		const $ = cheerioLoad(html);
		assert.equal($('#ssr').text(), 'true');
	});
});

describe('SSR Astro.locals from server', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	/** @type {import('./test-utils.js').App} */
	let app;

	before(async () => {
		fixture = await loadFixture(createBaseConfig('./dist/ssr-core/locals'));
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('Can access Astro.locals in page', async () => {
		const request = new Request('http://example.com/foo');
		const locals = { foo: 'bar' };
		const response = await app.render(request, { locals });
		const html = await response.text();
		const $ = cheerioLoad(html);
		assert.equal($('#foo').text(), 'bar');
	});

	it('Can access Astro.locals in api context', async () => {
		const request = new Request('http://example.com/api');
		const locals = { foo: 'bar' };
		const response = await app.render(request, { routeData: undefined, locals });
		assert.equal(response.status, 200);
		const body = await response.json();
		assert.equal(body.foo, 'bar');
	});

	it('404.astro can access locals provided to app.render()', async () => {
		const request = new Request('http://example.com/slkfnasf');
		const locals = { foo: 'par' };
		const response = await app.render(request, { locals });
		assert.equal(response.status, 404);
		const html = await response.text();
		const $ = cheerioLoad(html);
		assert.equal($('#foo').text(), 'par');
	});

	it('500.astro can access locals provided to app.render()', async () => {
		const request = new Request('http://example.com/go-to-error-page');
		const locals = { foo: 'par' };
		const response = await app.render(request, { locals });
		assert.equal(response.status, 500);
		const html = await response.text();
		const $ = cheerioLoad(html);
		assert.equal($('#foo').text(), 'par');
	});
});

describe('Markdown pages in SSR', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture(createBaseConfig('./dist/ssr-core/markdown'));
		await fixture.build();
	});

	it('Renders markdown pages correctly', async () => {
		const html = await fetchHTML(fixture, '/post');
		const $ = cheerioLoad(html);
		assert.equal($('#subheading').text(), 'Subheading');
	});
});

describe('SSR assets manifest', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			...createBaseConfig('./dist/ssr-core/assets'),
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build();
	});

	it('Includes CSS assets for SSR output', async () => {
		const app = await fixture.loadTestAdapterApp();
		const assets = Array.from(app.manifest.assets);
		assert.ok(assets.some((asset) => asset.endsWith('.css')));
	});
});

describe('SSR request integration', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			...createBaseConfig('./dist/ssr-core/request'),
			base: '/subpath/',
			integrations: [
				{
					name: 'inject-script',
					hooks: {
						'astro:config:setup'({ injectScript }) {
							injectScript('page', 'import "/src/scripts/inject-script.js";');
						},
					},
				},
			],
			vite: {
				build: {
					assetsInlineLimit: 0,
				},
			},
		});
		await fixture.build();
	});

	it('Gets the request passed in', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/subpath/request');
		const response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerioLoad(html);
		assert.equal($('#origin').text(), 'http://example.com');
	});

	it('public file is copied over', async () => {
		const json = await fixture.readFile('/client/cars.json');
		assert.notEqual(json, undefined);
	});

	it('CSS assets have their base prefix', async () => {
		const app = await fixture.loadTestAdapterApp();
		let request = new Request('http://example.com/subpath/request');
		let response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerioLoad(html);
		const linkHref = $('link').attr('href');
		assert.equal(linkHref.startsWith('/subpath/'), true);
		request = new Request('http://example.com' + linkHref);
		response = await app.render(request);
		assert.equal(response.status, 200);
		const css = await response.text();
		assert.notEqual(css, undefined);
	});

	it('script assets have their base prefix', async () => {
		const app = await fixture.loadTestAdapterApp();
		let request = new Request('http://example.com/subpath/request');
		let response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerioLoad(html);
		for (const el of $('script')) {
			const scriptSrc = $(el).attr('src');
			assert.equal(scriptSrc.startsWith('/subpath/'), true);
			request = new Request('http://example.com' + scriptSrc);
			response = await app.render(request);
			assert.equal(response.status, 200);
			const js = await response.text();
			assert.notEqual(js, undefined);
		}
	});

	it('assets can be fetched', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/subpath/cars.json');
		const response = await app.render(request);
		assert.equal(response.status, 200);
		const data = await response.json();
		assert.equal(data instanceof Array, true);
	});

	it('middleware gets the actual path sent in the request', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/this//is/my/////directory');
		const response = await app.render(request);
		assert.equal(response.status, 301);
	});
});

describe('SSR preview server', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			...createBaseConfig('./dist/ssr-core/preview'),
			adapter: testAdapter({ extendAdapter: { previewEntrypoint: './preview.mjs' } }),
		});
		await fixture.build();
	});

	it('preview server works', async () => {
		const previewServer = await fixture.preview();
		await previewServer.stop();
	});
});

describe('SSR API routes', () => {
	const config = {
		root: './fixtures/mega-ssr/',
		output: 'server',
		site: 'https://mysite.dev/subsite/',
		base: '/blog',
		adapter: testAdapter(),
		security: {
			checkOrigin: false,
		},
	};

	describe('Build', () => {
		/** @type {import('./test-utils.js').App} */
		let app;
		before(async () => {
			const fixture = await loadFixture(config);
			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		it('Basic pages work', async () => {
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			assert.notEqual(html, '');
		});

		it('Can load the API route too', async () => {
			const request = new Request('http://example.com/api/food.json');
			const response = await app.render(request);
			assert.equal(response.status, 200);
			assert.equal(response.statusText, 'tasty');
			const body = await response.json();
			assert.equal(body.length, 3);
		});

		it('Has valid api context', async () => {
			const request = new Request('http://example.com/api/context/any');
			const response = await app.render(request);
			assert.equal(response.status, 200);
			const data = await response.json();
			assert.equal(data.cookiesExist, true);
			assert.equal(data.requestExist, true);
			assert.equal(data.redirectExist, true);
			assert.equal(data.propsExist, true);
			assert.deepEqual(data.params, { param: 'any' });
			assert.match(data.generator, /^Astro v/);
			assert.equal(data.url, 'http://example.com/api/context/any');
			assert.equal(data.clientAddress, '0.0.0.0');
			assert.equal(data.site, 'https://mysite.dev/subsite/');
		});

		describe('custom status', () => {
			it('should return a custom status code and empty body for HEAD', async () => {
				const request = new Request('http://example.com/api/custom-status', { method: 'HEAD' });
				const response = await app.render(request);
				const text = await response.text();
				assert.equal(response.status, 403);
				assert.equal(text, '');
			});

			it('should return a 403 status code with the correct body for GET', async () => {
				const request = new Request('http://example.com/api/custom-status');
				const response = await app.render(request);
				const text = await response.text();
				assert.equal(response.status, 403);
				assert.equal(text, 'hello world');
			});

			it('should return the correct headers for GET', async () => {
				const request = new Request('http://example.com/api/custom-status');
				const response = await app.render(request);
				const headers = response.headers.get('x-hello');
				assert.equal(headers, 'world');
			});

			it('should return the correct headers for HEAD', async () => {
				const request = new Request('http://example.com/api/custom-status', { method: 'HEAD' });
				const response = await app.render(request);
				const headers = response.headers.get('x-hello');
				assert.equal(headers, 'world');
			});
		});
	});

	describe('Dev', () => {
		/** @type {import('./test-utils.js').DevServer} */
		let devServer;
		/** @type {import('./test-utils.js').Fixture} */
		let fixture;
		before(async () => {
			fixture = await loadFixture(config);
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Can POST to API routes', async () => {
			const response = await fixture.fetch('/api/food.json', {
				method: 'POST',
				body: 'some data',
			});
			assert.equal(response.status, 200);
			const text = await response.text();
			assert.equal(text, 'ok');
		});

		it('Can read custom status text from API routes', async () => {
			const response = await fixture.fetch('/api/food.json', {
				method: 'POST',
				body: 'not some data',
			});
			assert.equal(response.status, 400);
			assert.equal(response.statusText, 'not ok');
			const text = await response.text();
			assert.equal(text, 'not ok');
		});

		it('Can be passed binary data from multipart formdata', async () => {
			const formData = new FormData();
			const raw = await fs.promises.readFile(
				new URL('./fixtures/mega-ssr/src/images/penguin.jpg', import.meta.url),
			);
			const file = new File([raw], 'penguin.jpg', { type: 'text/jpg' });
			formData.set('file', file, 'penguin.jpg');

			const res = await fixture.fetch('/api/binary', {
				method: 'POST',
				body: formData,
			});

			assert.equal(res.status, 200);
		});

		it('Can set multiple headers of the same type', async () => {
			const response = await new Promise((resolve) => {
				const { port } = devServer.address;
				const host = 'localhost';
				const socket = new net.Socket();
				socket.connect(port, host);
				socket.on('connect', () => {
					const rawRequest = `POST /blog/api/login HTTP/1.1\r\nHost: ${host}\r\n\r\n`;
					socket.write(rawRequest);
				});

				let rawResponse = '';
				socket.setEncoding('utf-8');
				socket.on('data', (chunk) => {
					rawResponse += chunk.toString();
					socket.destroy();
				});

				socket.on('close', () => {
					resolve(rawResponse);
				});
			});

			let count = 0;
			let exp = /set-cookie:/g;
			while (exp.test(response)) {
				count++;
			}

			assert.equal(count, 2, 'Found two separate set-cookie response headers');
		});

		it('can return an immutable response object', async () => {
			const response = await fixture.fetch('/api/fail');
			const text = await response.text();
			assert.equal(response.status, 500);
			assert.equal(text, '500 Internal Server Error');
		});

		it('Has valid api context', async () => {
			const response = await fixture.fetch('/api/context/any');
			assert.equal(response.status, 200);
			const data = await response.json();
			assert.ok(data.cookiesExist);
			assert.ok(data.requestExist);
			assert.ok(data.redirectExist);
			assert.ok(data.propsExist);
			assert.deepEqual(data.params, { param: 'any' });
			assert.match(data.generator, /^Astro v/);
			assert.ok(
				[
					'http://[::1]:4321/blog/api/context/any',
					'http://127.0.0.1:4321/blog/api/context/any',
				].includes(data.url),
			);
			assert.ok(['::1', '127.0.0.1'].includes(data.clientAddress));
			assert.equal(data.site, 'https://mysite.dev/subsite/');
		});
	});
});

describe('Dynamic pages in SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		const rootPath = './fixtures/mega-ssr/';
		fixture = await loadFixture({
			root: rootPath,
			output: 'server',
			outDir: './dist/ssr-core/dynamic',
			integrations: [
				{
					name: 'inject-routes',
					hooks: {
						'astro:config:setup': ({ injectRoute }) => {
							injectRoute({
								pattern: '/path-alias/[id]',
								entrypoint: './src/pages/api/products/[id].js',
							});

							const entrypoint = fileURLToPath(
								new URL(`${rootPath}.astro/test.astro`, import.meta.url),
							);
							mkdirSync(dirname(entrypoint), { recursive: true });
							writeFileSync(entrypoint, '<h1>Index</h1>');

							injectRoute({
								pattern: '/test',
								entrypoint,
							});
						},
					},
				},
			],
			adapter: testAdapter(),
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build();
	});

	async function matchRoute(path) {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('https://example.com' + path);
		return app.match(request);
	}

	async function fetchHTML(path) {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com' + path);
		const response = await app.render(request);
		return await response.text();
	}

	async function fetchJSON(path) {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com' + path);
		const response = await app.render(request);
		return await response.json();
	}

	it('Do not have to implement getStaticPaths', async () => {
		const html = await fetchHTML('/123');
		const $ = cheerioLoad(html);
		assert.equal($('h1').text(), 'Item 123');
	});

	it('Includes page styles', async () => {
		const html = await fetchHTML('/123');
		const $ = cheerioLoad(html);
		assert.equal($('link').length, 1);
	});

	it('Dynamic API routes work', async () => {
		const json = await fetchJSON('/api/products/33');
		assert.equal(json.id, '33');
	});

	it('Injected route work', async () => {
		const json = await fetchJSON('/path-alias/33');
		assert.equal(json.id, '33');
	});

	it('Public assets take priority', async () => {
		const favicon = await matchRoute('/favicon.ico');
		assert.equal(favicon, undefined);
	});

	it('injectRoute entrypoint should not fail build if containing the extension several times in the path', async () => {
		const html = await fetchHTML('/test');
		const $ = cheerioLoad(html);
		assert.equal($('h1').text(), 'Index');
	});
});

describe('SSR: prerender', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/mega-ssr/',
			output: 'server',
			outDir: './dist/ssr-core/prerender',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	describe('Prerendering', () => {
		it('Does not render static page', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/static');
			const response = await app.render(request);
			assert.equal(response.status, 404);
		});

		it('includes prerendered pages in the asset manifest', async () => {
			const app = await fixture.loadTestAdapterApp();
			const assets = app.manifest.assets;
			assert.equal(assets.has('/static/index.html'), true);
		});
	});

	describe('?raw imports work in both SSR and prerendered routes', () => {
		it('raw import works in SSR route', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/not-prerendered');
			const response = await app.render(request);
			assert.equal(response.status, 200);
			const html = await response.text();
			const $ = cheerioLoad(html);
			assert.equal($('#raw-styles').text().includes('background: blue'), true);
		});

		it('raw import works in prerendered route', async () => {
			const html = await fixture.readFile('/client/static/index.html');
			const $ = cheerioLoad(html);
			assert.equal($('#raw-styles').text().includes('background: blue'), true);
		});
	});

	describe('Shared component CSS works in both SSR and prerendered routes', () => {
		it('shared component CSS is included in SSR route', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/not-prerendered');
			const response = await app.render(request);
			assert.equal(response.status, 200);
			const html = await response.text();
			assert.match(html, /color:red/);
		});

		it('shared component CSS is included in prerendered route', async () => {
			const html = await fixture.readFile('/client/static/index.html');
			assert.match(html, /color:red/);
		});
	});

	describe('Astro.params in SSR', () => {
		it('Params are passed to component', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/users/houston');
			const response = await app.render(request);
			assert.equal(response.status, 200);
			const html = await response.text();
			const $ = cheerioLoad(html);
			assert.equal($('.user').text(), 'houston');
		});
	});

	describe('New prerender option breaks catch-all route on root when using preview', () => {
		it('fix bug id #6020', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/some');
			const response = await app.render(request);
			assert.equal(response.status, 200);
			const html = await response.text();
			const $ = cheerioLoad(html);
			assert.equal($('p').text().includes('not give 404'), true);
		});
	});
});

describe.skip('Integrations can hook into the prerendering decision', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	const testIntegration = {
		name: 'test prerendering integration',
		hooks: {
			['astro:build:setup']({ pages, target }) {
				if (target !== 'client') return;
				pages.get('src/pages/static.astro').route.prerender = false;
				pages.get('src/pages/not-prerendered.astro').route.prerender = true;
			},
		},
	};

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/mega-ssr/',
			output: 'server',
			outDir: './dist/ssr-core/integration-prerender',
			integrations: [testIntegration],
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('An integration can override the prerender flag', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/static');
		const response = await app.render(request);
		assert.equal(response.status, 200);
	});

	it('An integration can turn a normal page to a prerendered one', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/not-prerendered');
		const response = await app.render(request);
		assert.equal(response.status, 404);
	});
});

describe('SSR: prerender getStaticPaths', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('output: "server"', () => {
		describe('getStaticPaths - build calls', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/mega-ssr/',
					site: 'https://mysite.dev/',
					adapter: testAdapter(),
					base: '/blog',
					output: 'server',
					outDir: './dist/ssr-core/gsp-server',
				});
				await fixture.build();
			});

			afterEach(() => {
				globalThis.isCalledOnce = false;
			});

			it('is only called once during build', () => {
				assert.equal(true, true);
			});

			it('Astro.url sets the current pathname', async () => {
				const html = await fixture.readFile('/client/food/tacos/index.html');
				const $ = cheerioLoad(html);
				assert.equal($('#props').text(), '10');
				assert.equal($('#url').text(), '/blog/food/tacos/');
			});
		});

		describe('getStaticPaths - dev calls', () => {
			let devServer;

			before(async () => {
				globalThis.isCalledOnce = false;
				devServer = await fixture.startDevServer();
			});

			afterEach(() => {
				globalThis.isCalledOnce = false;
			});

			after(async () => {
				await devServer.stop();
			});

			it('only calls prerender getStaticPaths once', async () => {
				let res = await fixture.fetch('/blog/a');
				assert.equal(res.status, 200);

				res = await fixture.fetch('/blog/b');
				assert.equal(res.status, 200);

				res = await fixture.fetch('/blog/c');
				assert.equal(res.status, 200);
			});

			describe('404 behavior', () => {
				it('resolves 200 on matching static path - named params', async () => {
					const res = await fixture.fetch('/blog/pizza/provolone-sausage');
					assert.equal(res.status, 200);
				});

				it('resolves 404 on pattern match without static path - named params', async () => {
					const res = await fixture.fetch('/blog/pizza/provolone-pineapple');
					const html = await res.text();
					assert.equal(res.status, 404);
					assert.match(html, /404/);
				});

				it('resolves 200 on matching static path - rest params', async () => {
					const res = await fixture.fetch('/blog/pizza/grimaldis/new-york');
					assert.equal(res.status, 200);
				});

				it('resolves 404 on pattern match without static path - rest params', async () => {
					const res = await fixture.fetch('/blog/pizza/pizza-hut');
					const html = await res.text();
					assert.equal(res.status, 404);
					assert.match(html, /404/);
				});
			});

			it('resolves 200 on matching static paths', async () => {
				for (const page of [1, 2, 3]) {
					let res = await fixture.fetch(`/blog/posts/${page}`);
					assert.equal(res.status, 200);

					const html = await res.text();
					const $ = cheerioLoad(html);

					const canonical = $('link[rel=canonical]');
					assert.equal(
						canonical.attr('href'),
						`https://mysite.dev/blog/posts/${page}`,
						`doesn't trim the /${page} route param`,
					);
				}
			});
		});
	});

	describe('output: "static" with server output', () => {
		describe('getStaticPaths - build calls', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/mega-ssr/',
					site: 'https://mysite.dev/',
					adapter: testAdapter(),
					base: '/blog',
					output: 'static',
					outDir: './dist/ssr-core/gsp-static',
					vite: {
						plugins: [vitePluginRemovePrerenderExport()],
					},
				});
				await fixture.build();
			});

			afterEach(() => {
				globalThis.isCalledOnce = false;
			});

			it('is only called once during build', () => {
				assert.equal(true, true);
			});

			it('Astro.url sets the current pathname', async () => {
				const html = await fixture.readFile('/client/food/tacos/index.html');
				const $ = cheerioLoad(html);
				assert.equal($('#props').text(), '10');
				assert.equal($('#url').text(), '/blog/food/tacos/');
			});
		});

		describe('getStaticPaths - dev calls', () => {
			let devServer;

			before(async () => {
				globalThis.isCalledOnce = false;
				devServer = await fixture.startDevServer();
			});

			afterEach(() => {
				globalThis.isCalledOnce = false;
			});

			after(async () => {
				await devServer.stop();
			});

			it('only calls hybrid getStaticPaths once', async () => {
				let res = await fixture.fetch('/blog/a');
				assert.equal(res.status, 200);

				res = await fixture.fetch('/blog/b');
				assert.equal(res.status, 200);

				res = await fixture.fetch('/blog/c');
				assert.equal(res.status, 200);
			});

			describe('404 behavior', () => {
				it('resolves 200 on matching static path - named params', async () => {
					const res = await fixture.fetch('/blog/pizza/provolone-sausage');
					assert.equal(res.status, 200);
				});

				it('resolves 404 on pattern match without static path - named params', async () => {
					const res = await fixture.fetch('/blog/pizza/provolone-pineapple');
					const html = await res.text();
					assert.equal(res.status, 404);
					assert.match(html, /404/);
				});

				it('resolves 200 on matching static path - rest params', async () => {
					const res = await fixture.fetch('/blog/pizza/grimaldis/new-york');
					assert.equal(res.status, 200);
				});

				it('resolves 404 on pattern match without static path - rest params', async () => {
					const res = await fixture.fetch('/blog/pizza/pizza-hut');
					const html = await res.text();
					assert.equal(res.status, 404);
					assert.match(html, /404/);
				});
			});

			it('resolves 200 on matching static paths', async () => {
				for (const page of [1, 2, 3]) {
					let res = await fixture.fetch(`/blog/posts/${page}`);
					assert.equal(res.status, 200);

					const html = await res.text();
					const $ = cheerioLoad(html);

					const canonical = $('link[rel=canonical]');
					assert.equal(
						canonical.attr('href'),
						`https://mysite.dev/blog/posts/${page}`,
						`doesn't trim the /${page} route param`,
					);
				}
			});
		});
	});
});

describe('SSR with Large Array and client rendering', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/mega-ssr/',
			output: 'server',
			outDir: './dist/ssr-core/large-array',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('Using response.arrayBuffer() gets the right HTML', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/large-array');
		const response = await app.render(request);
		const data = await response.arrayBuffer();
		const html = new TextDecoder().decode(data);

		const $ = cheerioLoad(html);
		assert.equal($('head meta[name="viewport"]').length, 1);
		assert.equal($('head link[rel="icon"]').length, 1);
		assert.equal($('main').length, 1);
		assert.equal($('astro-island').length, 1);
		assert.equal($('h1').text(), 'Hello, Solid!');
	});
});

describe('Using the Partytown integration in SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/mega-ssr/',
			adapter: testAdapter(),
			output: 'server',
			outDir: './dist/ssr-core/partytown',
			integrations: [partytown()],
		});
		await fixture.build();
	});

	it('Has the scripts in the page', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerioLoad(html);
		assert.equal($('script').length, 1);
	});

	it('The partytown scripts are in the manifest', async () => {
		const app = await fixture.loadTestAdapterApp();
		const partytownScript = '/~partytown/partytown-sw.js';
		const assets = app.manifest.assets;
		let found = false;
		for (const asset of assets) {
			if (asset === partytownScript) {
				found = true;
				break;
			}
		}
		assert.equal(found, true);
	});
});

describe('Default 500 page', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	/** @type {import('./test-utils.js').App} */
	let app;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/mega-ssr/',
			output: 'server',
			adapter: testAdapter(),
			outDir: './dist/ssr-core/error-default',
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();
	});

	it('should correctly merge headers coming from the original response and the 500 response, when calling a catch-all route', async () => {
		const request = new Request('http://example.com/error/any');
		const response = await app.render(request);
		assert.equal(response.status, 500);
		assert.equal(response.headers.get('x-debug'), '1234');
		const html = await response.text();
		assert.match(html, /oops/);
	});
});

describe('404 and 500 pages', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/mega-ssr/',
			output: 'server',
			adapter: testAdapter(),
			outDir: './dist/ssr-core/error-pages',
			build: { inlineStylesheets: 'never' },
			security: { checkOrigin: false },
		});
	});

	describe('Development', () => {
		/** @type {import('./test-utils.js').DevServer} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Returns 404 when hitting an API route with the wrong method', async () => {
			let res = await fixture.fetch('/api/route', {
				method: 'PUT',
			});
			let html = await res.text();
			let $ = cheerioLoad(html);
			assert.equal($('h1').text(), 'Something went horribly wrong!');
		});
	});

	describe('Production', () => {
		/** @type {import('./test-utils.js').App} */
		let app;

		before(async () => {
			await fixture.build({});
			app = await fixture.loadTestAdapterApp();
		});

		it('404 page returned when a route does not match', async () => {
			const request = new Request('http://example.com/some/fake/route');
			const response = await app.render(request);
			assert.equal(response.status, 404);
			const html = await response.text();
			const $ = cheerioLoad(html);
			assert.equal($('h1').text(), 'Something went horribly wrong!');
		});

		it('404 page returned when a route does not match and passing routeData', async () => {
			const request = new Request('http://example.com/some/fake/route');
			const routeData = app.match(request);
			const response = await app.render(request, { routeData });
			assert.equal(response.status, 404);
			const html = await response.text();
			const $ = cheerioLoad(html);
			assert.equal($('h1').text(), 'Something went horribly wrong!');
		});

		it('404 page returned when a route does not match and imports are included', async () => {
			const request = new Request('http://example.com/blog/fake/route');
			const routeData = app.match(request);
			const response = await app.render(request, { routeData });
			assert.equal(response.status, 404);
			const html = await response.text();
			const $ = cheerioLoad(html);
			assert.equal($('head link').length, 1);
		});

		it('404 page returned when there is an 404 response returned from route', async () => {
			const request = new Request('http://example.com/causes-404');
			const response = await app.render(request);
			assert.equal(response.status, 404);
			const html = await response.text();
			const $ = cheerioLoad(html);
			assert.equal($('h1').text(), 'Something went horribly wrong!');
		});

		it('500 page returned when there is an error', async () => {
			const request = new Request('http://example.com/causes-error');
			const response = await app.render(request);
			assert.equal(response.status, 500);
			const html = await response.text();
			const $ = cheerioLoad(html);
			assert.equal($('h1').text(), 'This is an error page');
		});

		it('Returns 404 when hitting an API route with the wrong method', async () => {
			const request = new Request('http://example.com/api/route', {
				method: 'PUT',
			});
			const response = await app.render(request);
			assert.equal(response.status, 404);
			const html = await response.text();
			const $ = cheerioLoad(html);
			assert.equal($('h1').text(), 'Something went horribly wrong!');
		});
	});
});

describe('trailing slashes for error pages', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/mega-ssr/',
			output: 'server',
			adapter: testAdapter(),
			trailingSlash: 'always',
			outDir: './dist/ssr-core/error-trailing',
			security: { checkOrigin: false },
		});
	});

	describe('Development', () => {
		/** @type {import('./test-utils.js').DevServer} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('renders 404 page when a route does not match the request', async () => {
			const response = await fixture.fetch('/ashbfjkasn/');
			assert.equal(response.status, 404);
			const html = await response.text();
			const $ = cheerioLoad(html);
			assert.equal($('h1').text(), 'Something went horribly wrong!');
		});

		it('serves Vite assets correctly when trailingSlash is always', async () => {
			const response = await fixture.fetch('/@vite/client');
			assert.equal(response.status, 200);
		});
	});

	describe('Production', () => {
		/** @type {import('./test-utils.js').App} */
		let app;

		before(async () => {
			await fixture.build({});
			app = await fixture.loadTestAdapterApp();
		});

		it('renders 404 page when a route does not match the request', async () => {
			const response = await app.render(new Request('http://example.com/ajksalscla/'));
			assert.equal(response.status, 404);
			const html = await response.text();
			const $ = cheerioLoad(html);
			assert.equal($('h1').text(), 'Something went horribly wrong!');
		});
	});
});

describe('Integration buildConfig hook', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/mega-ssr/',
			output: 'server',
			outDir: './dist/ssr-core/adapter-build-config',
			adapter: {
				name: 'my-ssr-adapter',
				hooks: {
					'astro:config:setup': ({ config, updateConfig }) => {
						updateConfig({
							build: {
								server: new URL('./dist/.root/server/', config.root),
								client: new URL('./dist/.root/client/', config.root),
							},
							vite: {
								plugins: [
									{
										resolveId: {
											filter: {
												id: /^(astro\/app|@my-ssr)$/,
											},
											handler(id) {
												if (id === '@my-ssr') {
													return id;
												}
												return viteID(new URL('../dist/core/app/index.js', import.meta.url));
											},
										},
										load: {
											filter: {
												id: /^@my-ssr$/,
											},
											handler() {
												return `import { App } from 'astro/app';export function createExports(manifest) { return { manifest, createApp: () => new App(manifest) }; }`;
											},
										},
									},
								],
							},
						});
					},
					'astro:config:done': ({ setAdapter }) => {
						setAdapter({
							name: 'my-ssr-adapter',
							serverEntrypoint: '@my-ssr',
							exports: ['manifest', 'createApp'],
							supportedAstroFeatures: {},
						});
					},
				},
			},
		});
		await fixture.build();
	});

	it('Puts client files in the client folder', async () => {
		let data = await fixture.readFile('/.root/client/cars.json');
		assert.notEqual(data, undefined);
	});

	it('Puts the server entry into the server folder', async () => {
		let data = await fixture.readFile('/.root/server/entry.mjs');
		assert.notEqual(data, undefined);
	});
});

describe('Astro.params in SSR', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/mega-ssr/',
			adapter: testAdapter(),
			output: 'server',
			base: '/users/houston/',
			outDir: './dist/ssr-core/params-ssr',
		});
		await fixture.build();
	});

	it('Params are passed to component', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/users/houston/params/food');
		const response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerioLoad(html);
		assert.equal($('.category').text(), 'food');
	});

	describe('Non-english characters in the URL', () => {
		it('Params are passed to component', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/users/houston/params/東西/food');
			const response = await app.render(request);
			assert.equal(response.status, 200);
			const html = await response.text();
			const $ = cheerioLoad(html);
			assert.equal($('.category').text(), 'food');
		});
	});

	it('It uses encodeURI/decodeURI to decode parameters', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/users/houston/params/[page]');
		const response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerioLoad(html);
		assert.equal($('.category').text(), '[page]');
	});

	it('It accepts encoded URLs, and the params decoded', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/users/houston/params/%5Bpage%5D');
		const response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerioLoad(html);
		assert.equal($('.category').text(), '[page]');
	});

	it("It doesn't encode/decode URI characters such as %23 (#)", async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/users/houston/params/%23something');
		const response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerioLoad(html);
		assert.equal($('.category').text(), '%23something');
	});

	it("It doesn't encode/decode URI characters such as %2F (/)", async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/users/houston/params/%2Fsomething');
		const response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerioLoad(html);
		assert.equal($('.category').text(), '%2Fsomething');
	});

	it("It doesn't encode/decode URI characters such as %3F (?)", async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/users/houston/params/%3Fsomething');
		const response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerioLoad(html);
		assert.equal($('.category').text(), '%3Fsomething');
	});
});

describe('Astro.params in dev mode', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/mega-ssr/',
			adapter: testAdapter(),
			output: 'server',
			outDir: './dist/ssr-core/params-dev',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should handle non-english URLs', async () => {
		const html = await fixture.fetch('/params/你好').then((res) => res.text());
		const $ = cheerioLoad(html);
		assert.equal($('.category').text(), '你好');
	});
});

describe('Astro.params in static mode', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/mega-ssr/',
			outDir: './dist/ssr-core/params-static',
		});
		await fixture.build();
	});

	it('It creates files that have square brackets in their URL', async () => {
		const html = await fixture.readFile(encodeURI('/params/[page]/index.html'));
		const $ = cheerioLoad(html);
		assert.equal($('.category').text(), '[page]');
	});

	it("It doesn't encode/decode URI characters such as %23 (#)", async () => {
		const html = await fixture.readFile(encodeURI('/params/%23something/index.html'));
		const $ = cheerioLoad(html);
		assert.equal($('.category').text(), '%23something');
	});

	it("It doesn't encode/decode URI characters such as %2F (/)", async () => {
		const html = await fixture.readFile(encodeURI('/params/%2Fsomething/index.html'));
		const $ = cheerioLoad(html);
		assert.equal($('.category').text(), '%2Fsomething');
	});

	it("It doesn't encode/decode URI characters such as %3F (?)", async () => {
		const html = await fixture.readFile(encodeURI('/params/%3Fsomething/index.html'));
		const $ = cheerioLoad(html);
		assert.equal($('.category').text(), '%3Fsomething');
	});
});

/** @returns {import('vite').Plugin} */
function vitePluginRemovePrerenderExport() {
	const EXTENSIONS = ['.astro', '.ts'];
	const plugin = {
		name: 'remove-prerender-export',
		transform(code, id) {
			if (!EXTENSIONS.some((ext) => id.endsWith(ext))) return;
			return code.replace(/export\s+const\s+prerender\s+=\s+true;/g, '');
		},
	};
	return {
		name: 'remove-prerender-export-injector',
		configResolved(resolved) {
			resolved.plugins.unshift(plugin);
		},
	};
}
