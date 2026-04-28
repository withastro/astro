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
import { createPage, createTestApp } from '../mocks.ts';

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

// ---------- FetchState constructor ----------

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

// ---------- trailingSlash() ----------

describe('trailingSlash()', () => {
	it('returns undefined when no redirect is needed', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })], {
			trailingSlash: 'ignore',
		});
		const request = stampApp(new Request('http://example.com/about'), app);
		const state = new FetchState(request);

		const result = trailingSlash(state);
		assert.equal(result, undefined);
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

// ---------- redirects() ----------

describe('redirects()', () => {
	it('returns undefined when the route is not a redirect', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		const result = redirects(state);
		assert.equal(result, undefined);
	});

	it('returns a redirect response when the route is a redirect', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);
		// Override routeData to simulate a redirect route
		state.routeData = {
			...state.routeData,
			type: 'redirect',
			redirect: '/new',
			redirectRoute: undefined,
		} as any;
		state.params = {};

		const result = redirects(state);
		assert.ok(result !== undefined);
		const response = await result;
		assert.equal(response.status, 301);
		assert.equal(response.headers.get('location'), '/new');
	});
});

// ---------- actions() ----------

describe('actions()', () => {
	it('returns undefined for a non-action GET request', () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		const result = actions(state);
		assert.equal(result, undefined);
	});
});

// ---------- middleware() ----------

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

// ---------- pages() ----------

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
});

// ---------- i18n() ----------

describe('i18n()', () => {
	it('passes through the response when i18n is not configured', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/' })]);
		const request = stampApp(new Request('http://example.com/'), app);
		const state = new FetchState(request);

		const original = new Response('original body');
		const result = await i18n(state, original);

		assert.equal(result, original);
	});
});

// ---------- astro() combined handler ----------

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
});

// ---------- Composed pipeline (like the changeset example) ----------

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
