// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { Pages } from '../../../dist/core/app/pages.js';
import { createManifest, createRouteInfo } from './test-helpers.js';
import { createRouteData } from '../mocks.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a Pages instance from a set of pages (routeData + module pairs).
 *
 * @param {Array<{ routeData: object, module: Function }>} pages
 * @param {object} [manifestOverrides]
 */
function createTestPages(pages, manifestOverrides = {}) {
	const routes = [];
	const pageMap = new Map();
	for (const { routeData, module } of pages) {
		routes.push(createRouteInfo(routeData));
		pageMap.set(routeData.component, module);
	}
	return new Pages(createManifest({ routes, pageMap, ...manifestOverrides }));
}

/**
 * @param {Function} component
 * @param {object} routeConfig
 */
function createPage(component, routeConfig) {
	const routeData = createRouteData(routeConfig);
	return {
		routeData,
		module: async () => ({ page: async () => ({ default: component }) }),
	};
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

const okPage = createComponent(() => render`<h1>OK</h1>`);
const notFoundPage = createComponent(() => render`<h1>Not Found</h1>`);

// ---------------------------------------------------------------------------
// Tests: basic rendering
// ---------------------------------------------------------------------------

describe('Pages.render() — basic rendering', () => {
	const pagesInstance = createTestPages([createPage(okPage, { route: '/about' })]);

	it('renders a matched route with status 200', async () => {
		const res = await pagesInstance.render(new Request('http://example.com/about'));
		assert.equal(res.status, 200);
	});

	it('returns 404 for an unmatched route when no 404 page exists', async () => {
		const res = await pagesInstance.render(new Request('http://example.com/missing'));
		assert.equal(res.status, 404);
	});
});

// ---------------------------------------------------------------------------
// Tests: custom 404 page
// ---------------------------------------------------------------------------

describe('Pages.render() — custom 404 page', () => {
	const notFoundRouteData = createRouteData({ route: '/404', component: 'src/pages/404.astro' });
	const pages = createTestPages([
		createPage(okPage, { route: '/about' }),
		{
			routeData: notFoundRouteData,
			module: async () => ({ page: async () => ({ default: notFoundPage }) }),
		},
	]);

	it('renders custom 404 page for unmatched routes', async () => {
		const res = await pages.render(new Request('http://example.com/missing'));
		assert.equal(res.status, 404);
		assert.match(await res.text(), /Not Found/);
	});
});

// ---------------------------------------------------------------------------
// Tests: trailing slash redirects
// ---------------------------------------------------------------------------

describe('Pages.render() — trailingSlash: always', () => {
	const pages = createTestPages([createPage(okPage, { route: '/about' })], {
		trailingSlash: 'always',
	});

	it('redirects GET to add trailing slash', async () => {
		const res = await pages.render(new Request('http://example.com/about'));
		assert.equal(res.status, 301);
		assert.equal(res.headers.get('location'), '/about/');
	});

	it('redirects POST with 308', async () => {
		const res = await pages.render(new Request('http://example.com/about', { method: 'POST' }));
		assert.equal(res.status, 308);
	});

	it('does not redirect when trailing slash already present', async () => {
		const res = await pages.render(new Request('http://example.com/about/'));
		assert.equal(res.status, 200);
	});
});

describe('Pages.render() — trailingSlash: never', () => {
	const pages = createTestPages([createPage(okPage, { route: '/about' })], {
		trailingSlash: 'never',
	});

	it('redirects GET to remove trailing slash', async () => {
		const res = await pages.render(new Request('http://example.com/about/'));
		assert.equal(res.status, 301);
		assert.equal(res.headers.get('location'), '/about');
	});

	it('does not redirect when no trailing slash', async () => {
		const res = await pages.render(new Request('http://example.com/about'));
		assert.equal(res.status, 200);
	});
});

describe('Pages.render() — trailingSlash: ignore', () => {
	const pages = createTestPages([createPage(okPage, { route: '/about' })], {
		trailingSlash: 'ignore',
	});

	it('does not redirect with or without trailing slash', async () => {
		const withSlash = await pages.render(new Request('http://example.com/about/'));
		assert.equal(withSlash.status, 200);
		const withoutSlash = await pages.render(new Request('http://example.com/about'));
		assert.equal(withoutSlash.status, 200);
	});
});

// ---------------------------------------------------------------------------
// Tests: match()
// ---------------------------------------------------------------------------

describe('Pages.match()', () => {
	const pages = createTestPages([createPage(okPage, { route: '/about' })]);

	it('returns routeData for a matched route', () => {
		const routeData = pages.match(new Request('http://example.com/about'));
		assert.ok(routeData);
		assert.equal(routeData.route, '/about');
	});

	it('returns undefined for an unmatched route', () => {
		const routeData = pages.match(new Request('http://example.com/missing'));
		assert.equal(routeData, undefined);
	});

	it('returns undefined for a prerendered route', () => {
		const prerenderPage = createPage(okPage, { route: '/static', prerender: true });
		const p = createTestPages([prerenderPage]);
		const routeData = p.match(new Request('http://example.com/static'));
		assert.equal(routeData, undefined);
	});
});

// ---------------------------------------------------------------------------
// Tests: routeData passed in skips matching
// ---------------------------------------------------------------------------

describe('Pages.render() — routeData option', () => {
	const pages = createTestPages([
		createPage(okPage, { route: '/about' }),
		createPage(notFoundPage, { route: '/other' }),
	]);

	it('uses provided routeData instead of matching', async () => {
		const routeData = pages.match(new Request('http://example.com/other'));
		const res = await pages.render(new Request('http://example.com/about'), { routeData });
		// /other renders notFoundPage even though URL says /about
		assert.match(await res.text(), /Not Found/);
	});
});

// ---------------------------------------------------------------------------
// Tests: locals propagation
// ---------------------------------------------------------------------------

describe('Pages.render() — locals', () => {
	const localsPage = createComponent((result, props, slots) => {
		const Astro = result.createAstro(props, slots);
		const name = /** @type {any} */ (Astro.locals).name ?? 'unknown';
		return render`<p>${name}</p>`;
	});

	const pages = createTestPages([createPage(localsPage, { route: '/hello' })]);

	it('passes locals to the page', async () => {
		const res = await pages.render(new Request('http://example.com/hello'), {
			locals: { name: 'Astro' },
		});
		assert.match(await res.text(), /Astro/);
	});
});
