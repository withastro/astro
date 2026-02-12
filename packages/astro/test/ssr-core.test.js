import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
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
		assert.equal(html.includes('Custom 404'), false);
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
