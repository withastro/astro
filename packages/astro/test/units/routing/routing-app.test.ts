import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createTestApp, createPage, createRedirect, createEndpoint } from '../mocks.ts';
import type { APIContext } from '../../../dist/types/public/context.js';
import type { MiddlewareNext } from '../../../dist/types/public/common.js';

// #region Shared page components

const indexPage = createComponent(() => {
	return render`<html><body><h1>Home</h1></body></html>`;
});

const custom404Page = createComponent((result: any, props: any, slots: any) => {
	const Astro = result.createAstro(props, slots);
	return render`<html><body><h1>Page not found</h1><p>${Astro.url.pathname}</p></body></html>`;
});

const custom500Page = createComponent((result: any, props: any, slots: any) => {
	const Astro = result.createAstro(props, slots);
	const error = Astro.props.error;
	return render`<html><body><h1>Server Error</h1><p>${error?.message ?? 'Unknown'}</p></body></html>`;
});

const throwingPage = createComponent(() => {
	throw new Error('Intentional test error');
});

// #endregion

// #region Custom 404 page rendering

describe('Custom 404 via App — basic', () => {
	const app = createTestApp([
		createPage(indexPage, { route: '/', isIndex: true }),
		createPage(custom404Page, { route: '/404' }),
	]);

	it('renders the index page at /', async () => {
		const res = await app.render(new Request('http://example.com/'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Home');
	});

	it('renders custom 404 for unmatched routes', async () => {
		const res = await app.render(new Request('http://example.com/nonexistent'));
		assert.equal(res.status, 404);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Page not found');
	});

	it('returns 404 status code', async () => {
		const res = await app.render(new Request('http://example.com/does-not-exist'));
		assert.equal(res.status, 404);
	});
});

describe('Custom 404 via App — with middleware and locals', () => {
	const localsMiddleware = async (ctx: APIContext, next: MiddlewareNext) => {
		(ctx.locals as any).message = 'from middleware';
		return next();
	};

	const notFoundWithLocals = createComponent((result: any, props: any, slots: any) => {
		const Astro = result.createAstro(props, slots);
		return render`<html><body><h1>Page not found</h1><p class="message">${Astro.locals.message}</p></body></html>`;
	});

	const app = createTestApp(
		[
			createPage(indexPage, { route: '/', isIndex: true }),
			createPage(notFoundWithLocals, { route: '/404' }),
		],
		{ middleware: () => ({ onRequest: localsMiddleware }) },
	);

	it('custom 404 page receives middleware locals', async () => {
		const res = await app.render(new Request('http://example.com/unknown'));
		assert.equal(res.status, 404);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Page not found');
		assert.equal($('.message').text(), 'from middleware');
	});
});

describe('Custom 404 via App — page returning 404 Response', () => {
	const returnsNotFound = createComponent(() => {
		return new Response(null, { status: 404 });
	});

	const app = createTestApp([
		createPage(indexPage, { route: '/', isIndex: true }),
		createPage(returnsNotFound, { route: '/trigger-404' }),
		createPage(custom404Page, { route: '/404' }),
	]);

	it('route returning 404 Response triggers custom 404 page', async () => {
		const res = await app.render(new Request('http://example.com/trigger-404'));
		assert.equal(res.status, 404);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Page not found');
	});
});

// #endregion

// #region Custom 500 error page

describe('Custom 500 via App', () => {
	const app = createTestApp([
		createPage(indexPage, { route: '/', isIndex: true }),
		createPage(throwingPage, { route: '/throwing' }),
		createPage(custom500Page, { route: '/500' }),
	]);

	it('route that throws renders custom 500 page', async () => {
		const res = await app.render(new Request('http://example.com/throwing'));
		assert.equal(res.status, 500);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Server Error');
	});
});

// #endregion

// #region 404 reroute loop prevention

describe('404 reroute loop prevention', () => {
	it('does not loop when 404 page sets response status 404 with body', async () => {
		// Case 1: 404.astro renders content but with status 404
		// The body is non-null so AstroHandler should not reroute
		const custom404WithBody = createComponent((result: any, props: any, slots: any) => {
			const Astro = result.createAstro(props, slots);
			Astro.response.status = 404;
			return render`<html><body><h1>Custom 404</h1></body></html>`;
		});

		const app = createTestApp([
			createPage(indexPage, { route: '/', isIndex: true }),
			createPage(custom404WithBody, { route: '/404' }),
		]);

		const res = await app.render(new Request('http://example.com/nonexistent'));
		assert.equal(res.status, 404);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Custom 404');
	});

	it('does not loop when 404 page returns null-body 404 Response', async () => {
		// Case 2: 404.astro returns new Response(null, { status: 404 })
		// PagesHandler stamps REROUTE_DIRECTIVE_HEADER = 'no' on /404 routes
		const custom404NullBody = createComponent(() => {
			return new Response(null, { status: 404 });
		});

		const app = createTestApp([
			createPage(indexPage, { route: '/', isIndex: true }),
			createPage(custom404NullBody, { route: '/404' }),
		]);

		const res = await app.render(new Request('http://example.com/nonexistent'));
		// Should return 404 without hanging
		assert.equal(res.status, 404);
	});

	it('does not loop when middleware wraps response with 404 status', async () => {
		// Case 3: Middleware rewrites responses with 404 status
		const middleware404 = async (ctx: APIContext, next: MiddlewareNext) => {
			const response = await next();
			if (ctx.url.pathname !== '/') {
				return new Response(response.body, { status: 404, headers: response.headers });
			}
			return response;
		};

		const app = createTestApp(
			[
				createPage(indexPage, { route: '/', isIndex: true }),
				createPage(custom404Page, { route: '/404' }),
			],
			{ middleware: () => ({ onRequest: middleware404 }) },
		);

		const res = await app.render(new Request('http://example.com/'));
		assert.equal(res.status, 200);

		const res404 = await app.render(new Request('http://example.com/nonexistent'));
		assert.equal(res404.status, 404);
	});

	it('does not loop when middleware returns null-body 404 for non-root paths', async () => {
		// Case 4: Middleware returns new Response(null, { status: 404 }) for non-/ paths
		const middleware404Null = async (ctx: APIContext, next: MiddlewareNext) => {
			if (ctx.url.pathname !== '/') {
				return new Response(null, { status: 404 });
			}
			return next();
		};

		const app = createTestApp(
			[
				createPage(indexPage, { route: '/', isIndex: true }),
				createPage(custom404Page, { route: '/404' }),
			],
			{ middleware: () => ({ onRequest: middleware404Null }) },
		);

		const res = await app.render(new Request('http://example.com/'));
		assert.equal(res.status, 200);

		const res404 = await app.render(new Request('http://example.com/anything'));
		assert.equal(res404.status, 404);
	});
});

// #endregion

// #region Redirects

describe('Redirects via App', () => {
	const destinationPage = createComponent(() => {
		return render`<html><body><h1>Destination</h1></body></html>`;
	});

	const app = createTestApp([
		createPage(indexPage, { route: '/', isIndex: true }),
		createPage(destinationPage, { route: '/destination' }),
		createRedirect({
			route: '/old',
			redirect: '/',
		}),
		createRedirect({
			route: '/old-page',
			redirect: { destination: '/destination', status: 301 },
		}),
		createRedirect({
			route: '/temp-redirect',
			redirect: { destination: '/destination', status: 302 },
		}),
	]);

	it('redirect returns 301 with Location header by default', async () => {
		const res = await app.render(new Request('http://example.com/old'));
		assert.equal(res.status, 301);
		assert.equal(res.headers.get('location'), '/');
	});

	it('redirect with explicit 301 returns correct Location', async () => {
		const res = await app.render(new Request('http://example.com/old-page'));
		assert.equal(res.status, 301);
		assert.equal(res.headers.get('location'), '/destination');
	});

	it('redirect with explicit status still redirects with Location', async () => {
		const res = await app.render(new Request('http://example.com/temp-redirect'));
		// Static redirects produce 301; the status in config is the _target_ not the redirect code
		assert.ok([301, 302].includes(res.status));
		assert.equal(res.headers.get('location'), '/destination');
	});
});

// #endregion

// #region Base + trailingSlash

describe('Routing via App — base path', () => {
	const aboutPage = createComponent(() => {
		return render`<html><body><h1>About</h1></body></html>`;
	});

	// In App (production), the Router strips the base prefix during matching,
	// so routes are defined without base and requests include the base prefix.
	const app = createTestApp(
		[
			createPage(indexPage, { route: '/', isIndex: true }),
			createPage(aboutPage, { route: '/about' }),
		],
		{ base: '/docs/' },
	);

	it('matches index under base path', async () => {
		const res = await app.render(new Request('http://example.com/docs/'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Home');
	});

	it('matches subpages under base path', async () => {
		const res = await app.render(new Request('http://example.com/docs/about'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'About');
	});
});

describe('Routing via App — trailingSlash never', () => {
	const aboutPage = createComponent(() => {
		return render`<html><body><h1>About</h1></body></html>`;
	});

	const app = createTestApp(
		[
			createPage(indexPage, { route: '/', isIndex: true, trailingSlash: 'never' }),
			createPage(aboutPage, { route: '/about', trailingSlash: 'never' }),
		],
		{ trailingSlash: 'never' },
	);

	it('matches without trailing slash', async () => {
		const res = await app.render(new Request('http://example.com/about'));
		assert.equal(res.status, 200);
	});
});

// #endregion

// #region Endpoint returning 404

describe('Endpoint returning 404 via App', () => {
	const app = createTestApp([
		createPage(indexPage, { route: '/', isIndex: true }),
		createEndpoint(
			{
				GET: (_ctx: APIContext) =>
					new Response('{"error":"not found"}', {
						status: 404,
						headers: { 'Content-Type': 'application/json' },
					}),
			},
			{ route: '/api/data' },
		),
		createPage(custom404Page, { route: '/404' }),
	]);

	it('endpoint 404 is not rerouted to custom 404 page', async () => {
		const res = await app.render(new Request('http://example.com/api/data'));
		assert.equal(res.status, 404);
		// Endpoint should return its own response, not the custom 404 page
		const body = await res.text();
		assert.ok(body.includes('"error"'));
	});
});
// #endregion
