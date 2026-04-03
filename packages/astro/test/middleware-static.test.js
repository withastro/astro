import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';
import { getStaticAssetPath } from '../dist/core/util/static-paths.js';

describe('Middleware for prerendered pages at request time', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('../src/core/app/app.js').App} */
	let app;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-static/',
			output: 'server',
			outDir: './dist/middleware-static',
			adapter: testAdapter({
				extendAdapter: {
					adapterFeatures: {
						buildOutput: 'server',
						middlewareMode: 'always',
					},
				},
			}),
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	async function readStaticHtml(pathname) {
		const staticAssetPath = getStaticAssetPath(pathname, {
			base: app.manifest.base,
			buildFormat: app.manifest.buildFormat,
		});
		try {
			return await fixture.readFile(`/client/${staticAssetPath}`);
		} catch {
			if (pathname.startsWith('/en/')) {
				const fallbackAssetPath = getStaticAssetPath(pathname.replace('/en/', '/'), {
					base: app.manifest.base,
					buildFormat: app.manifest.buildFormat,
				});
				return await fixture.readFile(`/client/${fallbackAssetPath}`);
			}
			throw new Error(`Missing static asset for pathname: ${pathname}`);
		}
	}

	it('injects middleware headers while serving static html', async () => {
		const getStaticAsset = async (_route, pathname) => {
			const html = await readStaticHtml(pathname);
			return new Response(html, {
				headers: {
					'content-type': 'text/html; charset=utf-8',
					'x-static-asset': 'true',
				},
			});
		};

		const request = new Request('http://example.com/about');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 200);
		assert.equal(response.headers.get('x-middleware-static'), 'true');
		assert.equal(response.headers.get('x-static-asset'), 'true');
		assert.match(await response.text(), /About static page/);
	});

	it('resolves encoded pathnames for static assets', async () => {
		const getStaticAsset = async (_route, pathname) => {
			const html = await readStaticHtml(pathname);
			return new Response(html, {
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
		};

		const request = new Request('http://example.com/My%20Page');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 200);
		assert.match(await response.text(), /Path with a space/);
	});

	it('redirects in middleware without loading static files', async () => {
		let staticReads = 0;
		const getStaticAsset = async (_route, pathname) => {
			staticReads++;
			const html = await readStaticHtml(pathname);
			return new Response(html, {
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
		};

		const request = new Request('http://example.com/private');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 302);
		assert.equal(response.headers.get('Location'), '/login');
		assert.equal(staticReads, 0);
	});

	it('returns 404 status when serving the prerendered 404 page', async () => {
		const getStaticAsset = async (_route, pathname) => {
			try {
				const html = await readStaticHtml(pathname);
				return new Response(html, {
					headers: { 'content-type': 'text/html; charset=utf-8' },
				});
			} catch {
				return undefined;
			}
		};

		const request = new Request('http://example.com/404');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 404);
		assert.match(await response.text(), /Custom static 404 page/);
	});

	it('resolves localized static paths through middleware', async () => {
		let requestedPathname = '';
		const getStaticAsset = async (_route, pathname) => {
			requestedPathname = pathname;
			const html = await readStaticHtml(pathname);
			return new Response(html, {
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
		};

		const request = new Request('http://example.com/fr/about');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 200);
		assert.equal(response.headers.get('x-middleware-static'), 'true');
		assert.equal(requestedPathname, '/fr/about');
		assert.match(await response.text(), /Bonjour page statique/);
	});

	it('resolves dynamic prerendered static paths through middleware', async () => {
		const getStaticAsset = async (_route, pathname) => {
			const html = await readStaticHtml(pathname);
			return new Response(html, {
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
		};

		const request = new Request('http://example.com/posts/alpha');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 200);
		assert.match(await response.text(), /Post: alpha/);
	});
});

describe('Middleware for prerendered pages with base path', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('../src/core/app/app.js').App} */
	let app;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-static-base/',
			output: 'server',
			outDir: './dist/middleware-static-base',
			adapter: testAdapter({
				extendAdapter: {
					adapterFeatures: {
						buildOutput: 'server',
						middlewareMode: 'always',
					},
				},
			}),
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	async function readStaticHtml(pathname) {
		const staticAssetPath = getStaticAssetPath(pathname, {
			base: app.manifest.base,
			buildFormat: app.manifest.buildFormat,
		});
		try {
			return await fixture.readFile(`/client/${staticAssetPath}`);
		} catch {
			throw new Error(`Missing static asset for pathname: ${pathname}`);
		}
	}

	it('injects headers with base path', async () => {
		const getStaticAsset = async (_route, pathname) => {
			const html = await readStaticHtml(pathname);
			return new Response(html, {
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
		};

		const request = new Request('http://example.com/test/about');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 200);
		assert.equal(response.headers.get('x-middleware-static'), 'true');
		assert.match(await response.text(), /About static page/);
	});

	it('redirects with base path without loading static files', async () => {
		let staticReads = 0;
		const getStaticAsset = async (_route, pathname) => {
			staticReads++;
			const html = await readStaticHtml(pathname);
			return new Response(html, {
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
		};

		const request = new Request('http://example.com/test/private');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 302);
		assert.match(response.headers.get('Location') ?? '', /\/login$/);
		assert.equal(staticReads, 0);
	});
});

describe('Classic mode without getStaticAsset callback', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('../src/core/app/app.js').App} */
	let app;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-static/',
			output: 'server',
			outDir: './dist/middleware-static-classic',
			adapter: testAdapter({
				extendAdapter: {
					adapterFeatures: {
						buildOutput: 'server',
						middlewareMode: 'classic',
					},
				},
			}),
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('returns 500 for prerendered pages when getStaticAsset is not provided', async () => {
		// In classic mode, the adapter does NOT provide getStaticAsset to app.render()
		// for prerendered pages at request time. When a prerendered page is rendered
		// without getStaticAsset in a server build (where the component isn't available),
		// it results in a 500 error.
		const request = new Request('http://example.com/about');
		const routeData = app.match(request, true);

		// No getStaticAsset callback provided - emulates classic mode behavior
		const response = await app.render(request, { routeData });

		// Without getStaticAsset and without component module, prerendered pages error with 500
		assert.equal(response.status, 500);
	});

	it('does not apply middleware redirect behavior in this failure path', async () => {
		const request = new Request('http://example.com/private');
		const routeData = app.match(request, true);

		// In classic mode, no getStaticAsset is provided
		const response = await app.render(request, { routeData });

		// Should return 500 because prerendered pages can't render without getStaticAsset in server build
		assert.equal(response.status, 500);
		// Redirect should not happen because middleware doesn't run for prerendered pages in classic mode
		assert.notEqual(response.headers.get('Location'), '/login');
	});
});

describe('Build-time middleware mode behavior', () => {
	it('on-request mode skips middleware effects during build prerendering', async () => {
		const fixture = await loadFixture({
			root: './fixtures/middleware-static/',
			output: 'server',
			outDir: './dist/middleware-static-build-on-request',
			adapter: testAdapter({
				extendAdapter: {
					adapterFeatures: {
						buildOutput: 'server',
						middlewareMode: 'on-request',
					},
				},
			}),
		});
		await fixture.build();
		const app = await fixture.loadTestAdapterApp();

		const staticAssetPath = getStaticAssetPath('/build-phase', {
			base: app.manifest.base,
			buildFormat: app.manifest.buildFormat,
		});
		const html = await fixture.readFile(`/client/${staticAssetPath}`);
		assert.match(html, /build-phase:no-middleware/);
	});
});

describe('Middleware static serving with directory format', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('../src/core/app/app.js').App} */
	let app;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-static/',
			output: 'server',
			outDir: './dist/middleware-static-directory',
			build: {
				format: 'directory',
			},
			adapter: testAdapter({
				extendAdapter: {
					adapterFeatures: {
						buildOutput: 'server',
						middlewareMode: 'always',
					},
				},
			}),
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	async function readStaticHtml(pathname) {
		const staticAssetPath = getStaticAssetPath(pathname, {
			base: app.manifest.base,
			buildFormat: app.manifest.buildFormat,
		});
		return fixture.readFile(`/client/${staticAssetPath}`);
	}

	it('serves directory-formatted prerendered pages through middleware', async () => {
		const getStaticAsset = async (_route, pathname) => {
			const html = await readStaticHtml(pathname);
			return new Response(html, {
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
		};

		const request = new Request('http://example.com/about');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 200);
		assert.equal(response.headers.get('x-middleware-static'), 'true');
		assert.match(await response.text(), /About static page/);
	});
});

describe('getStaticAssetPath preserve format', () => {
	it('maps preserve index routes to nested index.html paths', () => {
		assert.equal(
			getStaticAssetPath('/blog/index', { base: '/', buildFormat: 'preserve' }),
			'blog/index/index.html',
		);
	});
});
