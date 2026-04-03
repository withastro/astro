import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

function getStaticAssetPath(pathname, { base, buildFormat }) {
	const baseWithoutTrailingSlash = base === '/' ? '/' : base.replace(/\/$/, '');
	const baselessPathname =
		baseWithoutTrailingSlash !== '/' && pathname.startsWith(baseWithoutTrailingSlash)
			? pathname.slice(baseWithoutTrailingSlash.length)
			: pathname;
	const withoutLeadingSlash = baselessPathname.replace(/^\/+/, '');
	const withoutTrailingSlash = withoutLeadingSlash.replace(/\/+$/, '');

	if (withoutTrailingSlash === '') {
		return 'index.html';
	}

	if (buildFormat === 'directory') {
		if (withoutTrailingSlash === '404' || withoutTrailingSlash === '500') {
			return `${withoutTrailingSlash}.html`;
		}
		return `${withoutTrailingSlash}/index.html`;
	}

	if (withoutTrailingSlash.endsWith('.html')) {
		return withoutTrailingSlash;
	}

	return `${withoutTrailingSlash}.html`;
}

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
});
