import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { createComponent, render, renderComponent } from '../../../dist/runtime/server/index.js';
import { createTestApp, createPage } from '../mocks.ts';
import { dynamicPart, staticPart } from '../routing/test-helpers.ts';
import type { APIContext } from '../../../dist/types/public/context.js';

/**
 * Middleware that mirrors the integration test fixture's middleware.js:
 * stashes `ctx.routePattern` and `ctx.isPrerendered` into locals.
 */
function createLocalsMiddleware() {
	return async () => ({
		onRequest: async (ctx: APIContext, next: () => Promise<Response>) => {
			Object.assign(ctx.locals as Record<string, unknown>, {
				localsPattern: ctx.routePattern,
				localsPrerendered: ctx.isPrerendered,
			});
			return next();
		},
	});
}

// --- Shared components ---

/**
 * Renders Astro.url.pathname and Astro.url.searchParams,
 * plus Child and NestedChild pathname propagation.
 */
const NestedChild = createComponent((result: any, props: any, slots: any) => {
	const Astro = result.createAstro(props, slots);
	return render`<div id="nested-child-pathname">${Astro.url.pathname}</div>`;
});

const Child = createComponent((result: any, props: any, slots: any) => {
	const Astro = result.createAstro(props, slots);
	return render`<div id="child-pathname">${Astro.url.pathname}</div>${renderComponent(result, 'NestedChild', NestedChild, {})}`;
});

function createIndexPage({ withMiddlewareLocals = false } = {}) {
	return createComponent((result: any, props: any, slots: any) => {
		const Astro = result.createAstro(props, slots);
		const siteHref = Astro.site ? Astro.site.href : null;
		const middlewareHtml = withMiddlewareLocals
			? render`<p id="pattern">Astro route pattern: ${Astro.routePattern}</p><p id="pattern-middleware">Astro route pattern middleware: ${Astro.locals.localsPattern}</p><p id="prerender">Astro route prerender: ${JSON.stringify(Astro.isPrerendered)}</p><p id="prerender-middleware">Astro route prerender middleware: ${JSON.stringify(Astro.locals.localsPrerendered)}</p>`
			: render``;
		const siteAttr = siteHref ? ` href=${siteHref}` : '';
		return render`<html><head><title>Test</title></head><body><div id="pathname">${Astro.url.pathname}</div><div id="searchparams">${JSON.stringify(Astro.url.searchParams)}</div><a id="site"${siteAttr}>Home</a>${renderComponent(result, 'Child', Child, {})}${middlewareHtml}</body></html>`;
	});
}

function createRoutePage() {
	return createComponent((result: any, props: any, slots: any) => {
		const Astro = result.createAstro(props, slots);
		return render`<html><body><p id="pattern">Astro route pattern: ${Astro.routePattern}</p><p id="pattern-middleware">Astro route pattern middleware: ${Astro.locals.localsPattern}</p><p id="prerender">Astro route prerender: ${JSON.stringify(Astro.isPrerendered)}</p><p id="prerender-middleware">Astro route prerender middleware: ${JSON.stringify(Astro.locals.localsPrerendered)}</p></body></html>`;
	});
}

// --- Tests ---

describe('Astro Global', () => {
	describe('with site and base config', () => {
		it('Astro.url propagates through parent, child, and nested-child components', async () => {
			const page = createIndexPage();
			const app = createTestApp([createPage(page, { route: '/', isIndex: true })], {
				base: '/blog',
				site: 'https://mysite.dev/subsite/',
			});
			const response = await app.render(new Request('https://example.com/'));
			const html = await response.text();
			const $ = cheerio.load(html);

			// In the App context, Astro.url reflects the request URL.
			// The key assertion is that the same pathname propagates
			// consistently through parent, child, and nested-child components.
			assert.equal($('#pathname').text(), '/');
			assert.equal($('#searchparams').text(), '{}');
			assert.equal($('#child-pathname').text(), '/');
			assert.equal($('#nested-child-pathname').text(), '/');
		});

		it('Astro.site', async () => {
			const page = createIndexPage();
			const app = createTestApp([createPage(page, { route: '/', isIndex: true })], {
				site: 'https://mysite.dev/subsite/',
			});
			const response = await app.render(new Request('https://example.com/'));
			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('#site').attr('href'), 'https://mysite.dev/subsite/');
		});

		it('Astro.routePattern has the right value for static routes', async () => {
			const routePage = createRoutePage();
			const app = createTestApp(
				[
					createPage(routePage, { route: '/', isIndex: true }),
					createPage(routePage, { route: '/omit-markdown-extensions' }),
				],
				{
					base: '/blog',
					site: 'https://mysite.dev/subsite/',
					middleware: createLocalsMiddleware(),
				},
			);

			// Test index route
			let response = await app.render(new Request('https://example.com/'));
			let $ = cheerio.load(await response.text());
			assert.match($('#pattern').text(), /Astro route pattern: \//);
			assert.match($('#pattern-middleware').text(), /Astro route pattern middleware: \//);

			// Test named route
			response = await app.render(new Request('https://example.com/omit-markdown-extensions'));
			$ = cheerio.load(await response.text());
			assert.match($('#pattern').text(), /Astro route pattern: \/omit-markdown-extensions/);
			assert.match(
				$('#pattern-middleware').text(),
				/Astro route pattern middleware: \/omit-markdown-extensions/,
			);
		});

		it('Astro.routePattern has the right value for dynamic routes', async () => {
			const routePage = createRoutePage();
			const app = createTestApp(
				[
					createPage(routePage, {
						route: '/posts/[page]',
						segments: [[staticPart('posts')], [dynamicPart('page')]],
					}),
				],
				{
					base: '/blog',
					site: 'https://mysite.dev/subsite/',
					middleware: createLocalsMiddleware(),
				},
			);

			const response = await app.render(new Request('https://example.com/posts/1'));
			const $ = cheerio.load(await response.text());
			assert.equal($('#pattern').text(), 'Astro route pattern: /posts/[page]');
			assert.equal(
				$('#pattern-middleware').text(),
				'Astro route pattern middleware: /posts/[page]',
			);
		});

		it('Astro.isPrerendered is false in SSR mode', async () => {
			const routePage = createRoutePage();
			const app = createTestApp(
				[
					createPage(routePage, { route: '/', isIndex: true, prerender: false }),
					createPage(routePage, { route: '/about', prerender: false }),
				],
				{
					site: 'https://mysite.dev/subsite/',
					middleware: createLocalsMiddleware(),
					serverLike: true,
				},
			);

			let response = await app.render(new Request('https://example.com/'));
			let $ = cheerio.load(await response.text());
			assert.match($('#prerender').text(), /Astro route prerender: false/);
			assert.match($('#prerender-middleware').text(), /Astro route prerender middleware: false/);

			response = await app.render(new Request('https://example.com/about'));
			$ = cheerio.load(await response.text());
			assert.match($('#prerender').text(), /Astro route prerender: false/);
			assert.match($('#prerender-middleware').text(), /Astro route prerender middleware: false/);
		});
	});

	describe('SSR app', () => {
		it('Astro.site', async () => {
			const page = createIndexPage();
			const app = createTestApp([createPage(page, { route: '/', isIndex: true })], {
				site: 'https://mysite.dev/subsite/',
				base: '/new',
				serverLike: true,
			});
			const response = await app.render(new Request('https://example.com/'));
			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('#site').attr('href'), 'https://mysite.dev/subsite/');
		});

		it('Astro.routePattern has the right value in pages and components', async () => {
			const routePage = createRoutePage();
			const app = createTestApp(
				[
					createPage(routePage, { route: '/', isIndex: true }),
					createPage(routePage, { route: '/omit-markdown-extensions' }),
				],
				{
					base: '/new',
					site: 'https://mysite.dev/subsite/',
					middleware: createLocalsMiddleware(),
					serverLike: true,
				},
			);

			let response = await app.render(new Request('https://example.com/'));
			let $ = cheerio.load(await response.text());
			assert.match($('#pattern').text(), /Astro route pattern: \//);
			assert.match($('#pattern-middleware').text(), /Astro route pattern middleware: \//);

			response = await app.render(new Request('https://example.com/omit-markdown-extensions'));
			$ = cheerio.load(await response.text());
			assert.match($('#pattern').text(), /Astro route pattern: \/omit-markdown-extensions/);
			assert.match(
				$('#pattern-middleware').text(),
				/Astro route pattern middleware: \/omit-markdown-extensions/,
			);
		});

		it('Astro.isPrerendered is false with adapter and output server', async () => {
			const routePage = createRoutePage();
			const app = createTestApp(
				[
					createPage(routePage, { route: '/', isIndex: true, prerender: false }),
					createPage(routePage, { route: '/about', prerender: false }),
				],
				{
					site: 'https://mysite.dev/subsite/',
					middleware: createLocalsMiddleware(),
					serverLike: true,
				},
			);

			let response = await app.render(new Request('https://example.com/'));
			let $ = cheerio.load(await response.text());
			assert.match($('#prerender').text(), /Astro route prerender: false/);
			assert.match($('#prerender-middleware').text(), /Astro route prerender middleware: false/);

			response = await app.render(new Request('https://example.com/about'));
			$ = cheerio.load(await response.text());
			assert.match($('#prerender').text(), /Astro route prerender: false/);
			assert.match($('#prerender-middleware').text(), /Astro route prerender middleware: false/);
		});
	});
});

describe('Astro Global Defaults', () => {
	it('Astro.request.url with no site or base', async () => {
		const page = createIndexPage();
		const app = createTestApp([createPage(page, { route: '/', isIndex: true })]);
		const response = await app.render(new Request('https://example.com/'));
		const html = await response.text();
		const $ = cheerio.load(html);

		assert.equal($('#pathname').text(), '/');
		assert.equal($('#searchparams').text(), '{}');
		assert.equal($('#child-pathname').text(), '/');
		assert.equal($('#nested-child-pathname').text(), '/');
	});

	it('Astro.site is undefined when no site configured', async () => {
		const page = createIndexPage();
		const app = createTestApp([createPage(page, { route: '/', isIndex: true })]);
		const response = await app.render(new Request('https://example.com/'));
		const html = await response.text();
		const $ = cheerio.load(html);
		assert.equal($('#site').attr('href'), undefined);
	});
});
