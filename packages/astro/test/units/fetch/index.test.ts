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
import { ALL_PIPELINE_FEATURES } from '../../../dist/core/base-pipeline.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createEndpoint, createPage, createRedirect, createTestApp } from '../mocks.ts';
import { dynamicPart, spreadPart } from '../routing/test-helpers.ts';

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

	it('falls through to SSR route when prerendered dynamic route matches first', () => {
		// Regression test for #16834: when a prerendered dynamic route like
		// [a_prebuild].astro matches before an SSR dynamic route like [b_ssr].astro,
		// the SSR route should be used instead of returning 404.
		const prerenderPage = createPage(simplePage, {
			route: '/[a_prebuild]',
			prerender: true,
			pathname: undefined,
			segments: [[dynamicPart('a_prebuild')]],
		});
		const ssrPage = createPage(simplePage, {
			route: '/[b_ssr]',
			prerender: false,
			pathname: undefined,
			segments: [[dynamicPart('b_ssr')]],
		});

		const app = createTestApp([prerenderPage, ssrPage], { serverLike: true });
		const request = stampApp(new Request('http://example.com/foobar'), app);
		const state = new FetchState(request);

		assert.ok(state.routeData, 'routeData should be set to the SSR route');
		assert.equal(state.routeData!.route, '/[b_ssr]');
		assert.equal(state.routeData!.prerender, false);
	});

	it('falls back to the 404 route when no route matches', () => {
		const notFoundPage = createPage(simplePage, { route: '/404' });
		const app = createTestApp([createPage(simplePage, { route: '/' }), notFoundPage]);
		const request = stampApp(new Request('http://example.com/does-not-exist'), app);
		const state = new FetchState(request);

		assert.ok(state.routeData, 'routeData should fall back to the 404 route');
		assert.equal(state.routeData!.route, '/404');
	});

	it('preserves .html in pathname for endpoint routes with dynamic params', () => {
		// Regression test for #16941: when a dynamic endpoint returns a param
		// value like `file.html`, the `.html` suffix must not be stripped from
		// the pathname. Only page routes should have `.html` stripped (it is
		// framework-injected there), but for endpoints the suffix is user-provided.
		const endpoint = createEndpoint(
			{ GET: () => new Response('ok') },
			{
				route: '/[...path]',
				pathname: undefined,
				segments: [[spreadPart('path')]],
			},
		);
		const app = createTestApp([endpoint]);
		const request = stampApp(new Request('http://example.com/file.html'), app);
		const state = new FetchState(request);

		assert.ok(state.routeData, 'routeData should be set');
		assert.equal(state.routeData!.type, 'endpoint');
		assert.equal(state.pathname, '/file.html', '.html should be preserved for endpoint routes');
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

	it('renders the 404 page for unmatched routes instead of throwing', async () => {
		const notFoundPage = createComponent((_result: any, _props: any, _slots: any) => {
			return render`<h1>Not Found</h1>`;
		});
		const app = createTestApp([
			createPage(simplePage, { route: '/' }),
			createPage(notFoundPage, { route: '/404' }),
		]);
		const request = stampApp(new Request('http://example.com/does-not-exist'), app);
		const state = new FetchState(request);

		const response = await pages(state);

		assert.equal(response.status, 404);
		const text = await response.text();
		assert.match(text, /<h1>Not Found<\/h1>/);
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

	it('marks all pipeline features as used even when first request is a redirect', async () => {
		const app = createTestApp(
			[
				createRedirect({ route: '/old', redirect: '/new' }),
				createPage(simplePage, { route: '/new' }),
			],
			{
				middleware: async () => ({
					onRequest: async (_ctx: any, next: any) => next(),
				}),
			},
		);
		const request = stampApp(new Request('http://example.com/old'), app);
		const state = new FetchState(request);

		const response = await astro(state);
		assert.equal(response.status, 301);

		// astro() is the "batteries-included" handler — it should mark
		// every feature as used so the one-shot warnMissingFeatures check
		// in BaseApp never fires a false positive.
		assert.equal(
			state.pipeline.usedFeatures & ALL_PIPELINE_FEATURES,
			ALL_PIPELINE_FEATURES,
			'astro() should mark all pipeline features as used',
		);
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

// #region state.response

describe('state.response', () => {
	it('is set after pages() renders', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		assert.equal(state.response, undefined, 'response should be undefined before rendering');

		const response = await pages(state);

		assert.ok(state.response, 'response should be set after pages()');
		assert.equal(
			state.response,
			response,
			'state.response should be the same object returned by pages()',
		);
	});

	it('is set after middleware() completes', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		const response = await middleware(state, () => pages(state));

		assert.ok(state.response, 'response should be set after middleware()');
		assert.equal(
			state.response,
			response,
			'state.response should be the same object returned by middleware()',
		);
	});
});

// #endregion

// #region Context providers

describe('Context providers', () => {
	it('resolve returns undefined for an unregistered key', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		assert.equal(state.resolve('missing'), undefined);
	});

	it('provide + resolve lazily creates and caches the value', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		let createCalls = 0;
		state.provide('counter', {
			create() {
				createCalls++;
				return { count: 42 };
			},
		});

		const first = state.resolve('counter');
		const second = state.resolve('counter');

		assert.deepEqual(first, { count: 42 });
		assert.equal(first, second, 'resolve should return the cached instance');
		assert.equal(createCalls, 1, 'create should only be called once');
	});

	it('finalizeAll runs finalize callbacks for resolved providers', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		let finalized = false;
		state.provide('session', {
			create: () => ({ data: 'test' }),
			finalize: () => {
				finalized = true;
			},
		});

		// Resolve it so finalize will run
		state.resolve('session');
		await state.finalizeAll();

		assert.ok(finalized, 'finalize should have been called');
	});

	it('finalizeAll skips providers that were never resolved', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		let finalized = false;
		state.provide('unused', {
			create: () => 'value',
			finalize: () => {
				finalized = true;
			},
		});

		// Don't resolve — finalize should not run
		await state.finalizeAll();

		assert.equal(finalized, false, 'finalize should not run for unresolved providers');
	});
});

// #endregion

// #region X-Forwarded-* header resolution

describe('FetchState X-Forwarded-* header resolution', () => {
	it('ignores forwarded headers when allowedDomains is not configured', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(
			new Request('http://localhost:4321/', {
				headers: {
					'x-forwarded-proto': 'https',
					'x-forwarded-host': 'example.com',
				},
			}),
			app,
		);
		const state = new FetchState(request);

		assert.equal(state.url.protocol, 'http:');
		assert.equal(state.url.hostname, 'localhost');
	});

	it('applies X-Forwarded-Proto when allowedDomains is configured', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			allowedDomains: [{ hostname: '**' }],
		});
		const request = stampApp(
			new Request('http://localhost:4321/', {
				headers: {
					'x-forwarded-proto': 'https',
				},
			}),
			app,
		);
		const state = new FetchState(request);

		assert.equal(state.url.protocol, 'https:');
	});

	it('applies X-Forwarded-Host when allowedDomains matches', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			allowedDomains: [{ hostname: 'example.com' }],
		});
		const request = stampApp(
			new Request('http://localhost:4321/', {
				headers: {
					'x-forwarded-host': 'example.com',
				},
			}),
			app,
		);
		const state = new FetchState(request);

		assert.equal(state.url.hostname, 'example.com');
		assert.equal(state.url.port, '');
	});

	it('applies both X-Forwarded-Proto and X-Forwarded-Host together', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			allowedDomains: [{ hostname: 'example.com' }],
		});
		const request = stampApp(
			new Request('http://localhost:4321/', {
				headers: {
					'x-forwarded-proto': 'https',
					'x-forwarded-host': 'example.com',
				},
			}),
			app,
		);
		const state = new FetchState(request);

		assert.equal(state.url.protocol, 'https:');
		assert.equal(state.url.hostname, 'example.com');
	});

	it('applies X-Forwarded-Port when allowedDomains has port patterns', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			allowedDomains: [{ hostname: 'example.com', port: '8080' }],
		});
		const request = stampApp(
			new Request('http://localhost:4321/', {
				headers: {
					'x-forwarded-host': 'example.com',
					'x-forwarded-port': '8080',
				},
			}),
			app,
		);
		const state = new FetchState(request);

		assert.equal(state.url.hostname, 'example.com');
		assert.equal(state.url.port, '8080');
	});

	it('rejects X-Forwarded-Host when it does not match allowedDomains', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			allowedDomains: [{ hostname: 'trusted.com' }],
		});
		const request = stampApp(
			new Request('http://localhost:4321/', {
				headers: {
					'x-forwarded-host': 'evil.com',
				},
			}),
			app,
		);
		const state = new FetchState(request);

		assert.equal(state.url.hostname, 'localhost');
	});

	it('resolves clientAddress from X-Forwarded-For when host is trusted', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			allowedDomains: [{ hostname: 'example.com' }],
		});
		const request = stampApp(
			new Request('http://localhost:4321/', {
				headers: {
					'x-forwarded-host': 'example.com',
					'x-forwarded-for': '203.0.113.50, 70.41.3.18',
				},
			}),
			app,
		);
		const state = new FetchState(request);

		assert.equal(state.clientAddress, '203.0.113.50');
	});

	it('does not resolve clientAddress from X-Forwarded-For when host is not trusted', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			allowedDomains: [{ hostname: 'trusted.com' }],
		});
		const request = stampApp(
			new Request('http://localhost:4321/', {
				headers: {
					'x-forwarded-host': 'evil.com',
					'x-forwarded-for': '203.0.113.50',
				},
			}),
			app,
		);
		const state = new FetchState(request);

		assert.equal(state.clientAddress, undefined);
	});

	it('does not override clientAddress when already provided via options', async () => {
		// This simulates the case where the adapter already resolved the
		// client address (e.g. from the Node socket) and passed it through
		// render options.
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			allowedDomains: [{ hostname: 'example.com' }],
		});
		const request = new Request('http://localhost:4321/', {
			headers: {
				'x-forwarded-host': 'example.com',
				'x-forwarded-for': '203.0.113.50',
			},
		});
		// Use BaseFetchState directly to pass clientAddress via options
		const { FetchState: BaseFetchState } = await import('../../../dist/core/fetch/fetch-state.js');
		const { appSymbol: sym } = await import('../../../dist/core/constants.js');
		Reflect.set(request, sym, app);
		const state = new BaseFetchState(app.pipeline, request, {
			clientAddress: '10.0.0.1',
			addCookieHeader: false,
			locals: undefined,
			prerenderedErrorPageFetch: fetch,
			routeData: undefined,
			waitUntil: undefined,
		});

		assert.equal(state.clientAddress, '10.0.0.1');
	});

	it('handles headers set by user fetch handler before FetchState creation', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			allowedDomains: [{ hostname: 'example.com' }],
		});
		const request = stampApp(new Request('http://localhost:4321/'), app);

		// Simulate what a user would do in src/app.ts:
		request.headers.set('x-forwarded-host', 'example.com');
		request.headers.set('x-forwarded-proto', 'https');

		const state = new FetchState(request);

		assert.equal(state.url.protocol, 'https:');
		assert.equal(state.url.hostname, 'example.com');
	});

	it('renders through the full pipeline with forwarded headers applied', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			allowedDomains: [{ hostname: 'example.com' }],
		});
		const request = stampApp(
			new Request('http://localhost:4321/', {
				headers: {
					'x-forwarded-proto': 'https',
					'x-forwarded-host': 'example.com',
				},
			}),
			app,
		);
		const state = new FetchState(request);

		assert.equal(state.url.protocol, 'https:');
		assert.equal(state.url.hostname, 'example.com');

		const response = await astro(state);
		assert.equal(response.status, 200);
	});

	it('updates request.url to match the forwarded URL', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			allowedDomains: [{ hostname: 'example.com' }],
		});
		const request = stampApp(
			new Request('http://localhost:4321/page', {
				headers: {
					'x-forwarded-proto': 'https',
					'x-forwarded-host': 'example.com',
				},
			}),
			app,
		);
		const state = new FetchState(request);

		assert.equal(state.url.protocol, 'https:');
		assert.equal(state.url.hostname, 'example.com');

		const requestUrl = new URL(state.request.url);
		assert.equal(requestUrl.protocol, 'https:');
		assert.equal(requestUrl.hostname, 'example.com');
		assert.equal(requestUrl.pathname, '/page');
	});

	it('does not reconstruct request when no forwarded headers are validated', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			allowedDomains: [{ hostname: 'trusted.com' }],
		});
		const original = new Request('http://localhost:4321/', {
			headers: {
				'x-forwarded-host': 'evil.com',
			},
		});
		const request = stampApp(original, app);
		const state = new FetchState(request);

		// Rejected forwarded host — request should stay unchanged
		assert.equal(state.url.hostname, 'localhost');
		assert.equal(new URL(state.request.url).hostname, 'localhost');
	});

	it('carries appSymbol onto the reconstructed request so the app still resolves', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			allowedDomains: [{ hostname: 'example.com' }],
		});
		const original = new Request('http://localhost:4321/', {
			headers: {
				'x-forwarded-proto': 'https',
				'x-forwarded-host': 'example.com',
			},
		});
		const request = stampApp(original, app);
		const state = new FetchState(request);

		assert.notEqual(state.request, original);
		assert.equal(Reflect.get(state.request, appSymbol), app);
		const response = await astro(state);
		assert.equal(response.status, 200);
	});

	it('preserves method, headers and body when reconstructing for forwarded headers', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/api' })], {
			allowedDomains: [{ hostname: 'example.com' }],
		});
		const request = stampApp(
			new Request('http://localhost:4321/api', {
				method: 'POST',
				headers: {
					'content-type': 'application/x-www-form-urlencoded',
					'x-forwarded-proto': 'https',
					'x-forwarded-host': 'example.com',
				},
				body: 'token=abc123',
			}),
			app,
		);
		const state = new FetchState(request);

		assert.equal(new URL(state.request.url).protocol, 'https:');
		assert.equal(new URL(state.request.url).hostname, 'example.com');
		assert.equal(state.request.method, 'POST');
		assert.equal(state.request.headers.get('content-type'), 'application/x-www-form-urlencoded');
		assert.equal(await state.request.text(), 'token=abc123');
	});

	it('preserves a streaming request body (duplex) when reconstructing', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/api' })], {
			allowedDomains: [{ hostname: 'example.com' }],
		});
		const body = new ReadableStream({
			start(controller) {
				controller.enqueue(new TextEncoder().encode('chunked-payload'));
				controller.close();
			},
		});
		const init: any = {
			method: 'POST',
			headers: {
				'x-forwarded-proto': 'https',
				'x-forwarded-host': 'example.com',
			},
			body,
			duplex: 'half',
		};
		const request = stampApp(new Request('http://localhost:4321/api', init), app);
		const state = new FetchState(request);

		assert.equal(new URL(state.request.url).hostname, 'example.com');
		assert.equal(await state.request.text(), 'chunked-payload');
	});
});

// #endregion
