import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { appSymbol } from '../../../dist/core/constants.js';
import {
	FetchState,
	astro,
	trailingSlash,
	redirects,
	actions,
	middleware,
	pages,
	i18n,
} from '../../../dist/core/fetch/index.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createEndpoint, createPage, createRedirect, createTestApp } from '../mocks.ts';

/** A simple page component that renders `<h1>Hello</h1>`. */
const simplePage = createComponent((_result: any, _props: any, _slots: any) => {
	return render`<h1>Hello</h1>`;
});

/**
 * Stamps the `appSymbol` onto a request so `getApp()` inside the
 * `astro/fetch` module can find the associated App.
 */
function stampApp(request: Request, app: ReturnType<typeof createTestApp>): Request {
	Reflect.set(request, appSymbol, app);
	return request;
}

// #region FetchState constructor

describe('FetchState (astro/fetch)', () => {
	it('throws when the request has no attached app', () => {
		assert.throws(
			() => new FetchState(new Request('http://example.com/')),
			/without an attached app/,
		);
	});

	it('constructs successfully when the request has an attached app', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);
		assert.ok(state);
	});

	it('eagerly resolves the route from the request URL', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);
		assert.ok(state.routeData, 'routeData should be set by the constructor');
		assert.equal(state.routeData!.route, '/');
	});
});

// #endregion

// #region trailingSlash()

describe('trailingSlash()', () => {
	it('returns undefined when no redirect is needed', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			trailingSlash: 'ignore',
		});

		const withoutSlash = stampApp(new Request('http://example.com/about'), app);
		assert.equal(trailingSlash(new FetchState(withoutSlash)), undefined);

		const withSlash = stampApp(new Request('http://example.com/about/'), app);
		assert.equal(trailingSlash(new FetchState(withSlash)), undefined);
	});

	it('returns a redirect when trailing slash is required but missing', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			trailingSlash: 'always',
		});
		const request = stampApp(new Request('http://example.com/about'), app);
		const state = new FetchState(request);

		const result = trailingSlash(state);
		assert.ok(result instanceof Response);
		assert.equal(result.status, 301);
		assert.equal(result.headers.get('location'), '/about/');
	});

	it('returns a redirect when trailing slash is present but should be removed', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			trailingSlash: 'never',
		});
		const request = stampApp(new Request('http://example.com/about/'), app);
		const state = new FetchState(request);

		const result = trailingSlash(state);
		assert.ok(result instanceof Response);
		assert.equal(result.status, 301);
		assert.equal(result.headers.get('location'), '/about');
	});
});

// #endregion

// #region redirects()

describe('redirects()', () => {
	it('returns undefined when the route is not a redirect', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		const result = redirects(state);
		assert.equal(result, undefined);
	});

	it('returns a redirect response when the route is a redirect', async () => {
		const app = createTestApp([createRedirect({ route: '/old', redirect: '/new' })]);
		const request = stampApp(new Request('http://example.com/old'), app);
		const state = new FetchState(request);

		const result = redirects(state);
		assert.ok(result !== undefined);
		const response = await result;
		assert.equal(response.status, 301);
		assert.equal(response.headers.get('location'), '/new');
	});

	it('returns a redirect response for an external URL', async () => {
		const app = createTestApp([
			createRedirect({ route: '/old', redirect: 'https://other-site.com/landing' }),
		]);
		const request = stampApp(new Request('http://example.com/old'), app);
		const state = new FetchState(request);

		const result = redirects(state);
		assert.ok(result !== undefined);
		const response = await result;
		assert.equal(response.status, 301);
		assert.equal(response.headers.get('location'), 'https://other-site.com/landing');
	});
});

// #endregion

// #region actions()

describe('actions()', () => {
	it('returns undefined for a non-action GET request', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		const result = actions(state);
		assert.equal(result, undefined);
	});
});

// #endregion

// #region middleware()

describe('middleware()', () => {
	it('calls the next callback and returns its response', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		let nextCalled = false;
		const response = await middleware(state, async () => {
			nextCalled = true;
			return new Response('from next');
		});

		assert.ok(nextCalled, 'next callback should have been called');
		assert.equal(await response.text(), 'from next');
	});

	it('invokes user middleware when configured on the manifest', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			middleware: async () => ({
				onRequest: async (_ctx: any, next: any) => {
					const response = await next();
					response.headers.set('x-user-middleware', 'true');
					return response;
				},
			}),
		});
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		const response = await middleware(state, async () => new Response('page'));

		assert.equal(response.headers.get('x-user-middleware'), 'true');
		assert.equal(await response.text(), 'page');
	});
});

// #endregion

// #region pages()

describe('pages()', () => {
	it('renders a matched page', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		const response = await pages(state);

		assert.equal(response.status, 200);
		const text = await response.text();
		assert.match(text, /<h1>Hello<\/h1>/);
	});

	it('renders an endpoint', async () => {
		const app = createTestApp([
			createEndpoint(
				{
					GET: () =>
						new Response(JSON.stringify({ ok: true }), {
							headers: { 'Content-Type': 'application/json' },
						}),
				},
				{ route: '/api/health' },
			),
		]);
		const request = stampApp(new Request('http://example.com/api/health'), app);
		const state = new FetchState(request);

		const response = await pages(state);

		assert.equal(response.status, 200);
		assert.equal(response.headers.get('Content-Type'), 'application/json');
		const body = await response.json();
		assert.equal(body.ok, true);
	});

	it('returns 404 for an endpoint with no matching method handler', async () => {
		const app = createTestApp([
			createEndpoint({ GET: () => new Response('ok') }, { route: '/api/health' }),
		]);
		const request = stampApp(new Request('http://example.com/api/health', { method: 'POST' }), app);
		const state = new FetchState(request);

		const response = await pages(state);

		assert.equal(response.status, 404);
	});
});

// #endregion

// #region i18n()

describe('i18n()', () => {
	it('passes through the response when i18n is not configured', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		const original = new Response('original body');
		const result = await i18n(state, original);

		assert.equal(result, original);
	});

	it('redirects to the default locale when prefix-always and no locale in path', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			i18n: {
				defaultLocale: 'en',
				locales: ['en', 'fr'],
				strategy: 'pathname-prefix-always',
				fallbackType: 'rewrite',
				fallback: {},
				domains: {},
				domainLookupTable: {},
			},
		});
		const request = stampApp(new Request('http://example.com/about'), app);
		const state = new FetchState(request);

		const pageResponse = new Response('page body', {
			headers: { 'X-Astro-Route-Type': 'page' },
		});
		const result = await i18n(state, pageResponse);

		assert.equal(result.status, 404);
	});

	it('passes through the response for a valid locale path', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/en' })], {
			i18n: {
				defaultLocale: 'en',
				locales: ['en', 'fr'],
				strategy: 'pathname-prefix-always',
				fallbackType: 'rewrite',
				fallback: {},
				domains: {},
				domainLookupTable: {},
			},
		});
		const request = stampApp(new Request('http://example.com/en/about'), app);
		const state = new FetchState(request);

		const pageResponse = new Response('page body', {
			headers: { 'X-Astro-Route-Type': 'page' },
		});
		const result = await i18n(state, pageResponse);

		assert.equal(result.status, 200);
		assert.equal(await result.text(), 'page body');
	});

	it('passes through non-page responses unchanged even with i18n configured', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			i18n: {
				defaultLocale: 'en',
				locales: ['en', 'fr'],
				strategy: 'pathname-prefix-always',
				fallbackType: 'rewrite',
				fallback: {},
				domains: {},
				domainLookupTable: {},
			},
		});
		const request = stampApp(new Request('http://example.com/api/data'), app);
		const state = new FetchState(request);

		// No X-Astro-Route-Type header — simulates an endpoint response
		const apiResponse = new Response('{"ok":true}');
		const result = await i18n(state, apiResponse);

		assert.equal(result, apiResponse);
	});
});

// #endregion

// #region astro() combined handler

describe('astro() combined handler', () => {
	it('renders a page through the full pipeline', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		const response = await astro(state);

		assert.equal(response.status, 200);
		const text = await response.text();
		assert.match(text, /<h1>Hello<\/h1>/);
	});

	it('returns a redirect for redirect routes', async () => {
		const app = createTestApp([
			createRedirect({ route: '/old', redirect: '/new' }),
			createPage(simplePage, { route: '/new' }),
		]);
		const request = stampApp(new Request('http://example.com/old'), app);
		const state = new FetchState(request);

		const response = await astro(state);

		assert.equal(response.status, 301);
		assert.equal(response.headers.get('location'), '/new');
	});

	it('applies trailing slash redirect before rendering', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/about' })], {
			trailingSlash: 'always',
		});
		const request = stampApp(new Request('http://example.com/about'), app);
		const state = new FetchState(request);

		const response = await astro(state);

		assert.equal(response.status, 301);
		assert.equal(response.headers.get('location'), '/about/');
	});

	it('runs middleware when configured', async () => {
		const app = createTestApp(
			[
				createPage(
					createComponent((result: any, props: any, slots: any) => {
						const Astro = result.createAstro(props, slots);
						return render`<p>${Astro.locals.from}</p>`;
					}),
					{ route: '/' },
				),
			],
			{
				middleware: async () => ({
					onRequest: async (ctx: any, next: any) => {
						ctx.locals.from = 'middleware';
						return next();
					},
				}),
			},
		);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		const response = await astro(state);

		assert.equal(response.status, 200);
		assert.match(await response.text(), /middleware/);
	});
});

// #endregion

// #region Composed pipeline

describe('Composed pipeline', () => {
	it('renders a page through individually composed handlers', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		// Mimics the astro/fetch example from the changeset
		const slash = trailingSlash(state);
		assert.equal(slash, undefined, 'no trailing slash redirect expected');

		const redirect = redirects(state);
		assert.equal(redirect, undefined, 'no redirect expected');

		const action = actions(state);
		assert.equal(action, undefined, 'no action expected');

		const response = await middleware(state, () => pages(state));
		const final = await i18n(state, response);

		assert.equal(final.status, 200);
		assert.match(await final.text(), /<h1>Hello<\/h1>/);
	});
});

// #endregion
