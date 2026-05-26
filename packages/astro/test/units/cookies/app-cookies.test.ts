import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createEndpoint, createTestApp } from '../mocks.ts';

import type { MiddlewareHandler } from 'astro';
import type { APIContext } from '../../../dist/types/public/context.js';

/**
 * Tests for cookie behavior through the App pipeline.
 *
 * Covers: setCookieHeaders(), addCookieHeader option, cookie propagation
 * across rewrites (endpoint-to-endpoint, middleware-to-endpoint), and cookie
 * read/write in endpoints.
 *
 * Migrated from the integration test in test/astro-cookies.test.ts.
 */

// #region Route factories

function getJsonEndpoint() {
	return createEndpoint(
		{
			GET: (ctx: APIContext) => {
				const prefs = ctx.cookies.get('prefs')!.json();
				return new Response(
					`<html><body><dl><dt>mode</dt><dd>${prefs.mode}</dd></dl></body></html>`,
					{ headers: { 'Content-Type': 'text/html' } },
				);
			},
		},
		{ route: '/get-json' },
	);
}

function setValueEndpoint() {
	return createEndpoint(
		{
			POST: (ctx: APIContext) => {
				ctx.cookies.set('admin', 'true', { expires: new Date() });
				return new Response('<html><body><h1>Testing</h1></body></html>', {
					headers: { 'Content-Type': 'text/html' },
				});
			},
		},
		{ route: '/set-value' },
	);
}

function earlyReturnEndpoint() {
	return createEndpoint(
		{
			GET: (ctx: APIContext) => {
				const mode = ctx.cookies.get('prefs')!.json().mode;
				ctx.cookies.set('prefs', {
					mode: mode === 'light' ? 'dark' : 'light',
				});
				return new Response(null, {
					status: 302,
					headers: { Location: '/prefs' },
				});
			},
		},
		{ route: '/early-return' },
	);
}

function setPrefsEndpoint() {
	return createEndpoint(
		{
			POST: (ctx: APIContext) => {
				const mode = ctx.cookies.get('prefs')!.json().mode;
				ctx.cookies.set('prefs', {
					mode: mode === 'light' ? 'dark' : 'light',
				});
				return new Response(null, {
					status: 302,
					headers: { Location: '/prefs' },
				});
			},
		},
		{ route: '/set-prefs' },
	);
}

function rewriteSourceEndpoint() {
	return createEndpoint(
		{
			GET: (ctx: APIContext) => {
				ctx.cookies.set('another', 'set-in-from');
				ctx.cookies.set('set-in-from', 'yes');
				return ctx.rewrite('/rewrite-target');
			},
		},
		{ route: '/from' },
	);
}

function rewriteTargetEndpoint() {
	return createEndpoint(
		{
			GET: (ctx: APIContext) => {
				ctx.cookies.set('my_cookie', 'value');
				ctx.cookies.set('another', 'set-in-target');
				return new Response('<html><body><h1>Page 2</h1></body></html>', {
					headers: { 'Content-Type': 'text/html' },
				});
			},
		},
		{ route: '/rewrite-target' },
	);
}

function fromEndpointRoute() {
	return createEndpoint(
		{
			GET: (ctx: APIContext) => ctx.rewrite('/to-endpoint'),
		},
		{ route: '/from-endpoint' },
	);
}

function toEndpointRoute() {
	return createEndpoint(
		{
			GET: (ctx: APIContext) => {
				ctx.cookies.set('test', 'value');
				return Response.json({ hi: 'world' });
			},
		},
		{ route: '/to-endpoint' },
	);
}

// #endregion

// #region Tests

describe('Astro.cookies', () => {
	it('is able to get cookies from the request', async () => {
		const app = createTestApp([getJsonEndpoint()]);
		const request = new Request('http://example.com/get-json', {
			headers: {
				cookie: `prefs=${encodeURIComponent(JSON.stringify({ mode: 'light' }))}`,
			},
		});
		const response = await app.render(request);

		assert.equal(response.status, 200);
		const html = await response.text();
		assert.match(html, /<dd>light<\/dd>/);
	});

	it('can set the cookie value', async () => {
		const app = createTestApp([setValueEndpoint()]);
		const request = new Request('http://example.com/set-value', { method: 'POST' });
		const response = await app.render(request);

		assert.equal(response.status, 200);
		const headers = Array.from(app.setCookieHeaders(response));
		assert.equal(headers.length, 1);
		assert.match(headers[0], /Expires/);
	});

	it('app.render can include the cookie in the Set-Cookie header', async () => {
		const app = createTestApp([setValueEndpoint()]);
		const request = new Request('http://example.com/set-value', { method: 'POST' });
		const response = await app.render(request, { addCookieHeader: true });

		assert.equal(response.status, 200);
		const value = response.headers.get('Set-Cookie');
		assert.equal(typeof value, 'string');
		assert.equal(value!.startsWith('admin=true; Expires='), true);
	});

	it('app.render can exclude the cookie from the Set-Cookie header', async () => {
		const app = createTestApp([setValueEndpoint()]);
		const request = new Request('http://example.com/set-value', { method: 'POST' });
		const response = await app.render(request, { addCookieHeader: false });

		assert.equal(response.status, 200);
		assert.equal(response.headers.get('Set-Cookie'), null);
	});

	it('early returning a Response still includes set headers', async () => {
		const app = createTestApp([earlyReturnEndpoint()]);
		const request = new Request('http://example.com/early-return', {
			headers: {
				cookie: `prefs=${encodeURIComponent(JSON.stringify({ mode: 'light' }))}`,
			},
		});
		const response = await app.render(request);

		assert.equal(response.status, 302);
		const headers = Array.from(app.setCookieHeaders(response));
		assert.equal(headers.length, 1);
		const raw = headers[0].slice(6);
		const data = JSON.parse(decodeURIComponent(raw));
		assert.equal(typeof data, 'object');
		assert.equal(data.mode, 'dark');
	});

	it('API route can get and set cookies', async () => {
		const app = createTestApp([setPrefsEndpoint()]);
		const request = new Request('http://example.com/set-prefs', {
			method: 'POST',
			headers: {
				cookie: `prefs=${encodeURIComponent(JSON.stringify({ mode: 'light' }))}`,
			},
		});
		const response = await app.render(request);

		assert.equal(response.status, 302);
		const headers = Array.from(app.setCookieHeaders(response));
		assert.equal(headers.length, 1);
		const raw = headers[0].slice(6);
		const data = JSON.parse(decodeURIComponent(raw));
		assert.equal(typeof data, 'object');
		assert.equal(data.mode, 'dark');
	});

	it('can set cookies in a rewritten page request', async () => {
		const app = createTestApp([rewriteSourceEndpoint(), rewriteTargetEndpoint()]);
		const request = new Request('http://example.com/from');
		const response = await app.render(request, { addCookieHeader: true });

		assert.equal(response.status, 200);
		assert.match(response.headers.get('Set-Cookie')!, /my_cookie=value/);
	});

	it('overwrites cookie values set in the source page with values from the target page', async () => {
		const app = createTestApp([rewriteSourceEndpoint(), rewriteTargetEndpoint()]);
		const request = new Request('http://example.com/from');
		const response = await app.render(request, { addCookieHeader: true });

		assert.equal(response.status, 200);
		assert.match(response.headers.get('Set-Cookie')!, /another=set-in-target/);
	});

	it('allows cookies to be set in the source page', async () => {
		const app = createTestApp([rewriteSourceEndpoint(), rewriteTargetEndpoint()]);
		const request = new Request('http://example.com/from');
		const response = await app.render(request, { addCookieHeader: true });

		assert.equal(response.status, 200);
		assert.match(response.headers.get('Set-Cookie')!, /set-in-from=yes/);
	});

	it('can set cookies in a rewritten endpoint request', async () => {
		const app = createTestApp([fromEndpointRoute(), toEndpointRoute()]);
		const request = new Request('http://example.com/from-endpoint');
		const response = await app.render(request, { addCookieHeader: true });

		assert.equal(response.status, 200);
		assert.match(response.headers.get('Set-Cookie')!, /test=value/);
	});

	it('can set cookies in a rewritten endpoint request from middleware', async () => {
		const middleware: MiddlewareHandler = async (ctx, next) => {
			if (ctx.url.pathname === '/rewrite-me') {
				return next('/rewrite-target');
			}
			return next();
		};
		const rewriteMeRoute = createEndpoint(
			{
				GET: () => new Response('should not reach here'),
			},
			{ route: '/rewrite-me' },
		);
		const app = createTestApp([rewriteMeRoute, rewriteTargetEndpoint()], {
			middleware: async () => ({ onRequest: middleware }),
		});
		const request = new Request('http://example.com/rewrite-me');
		const response = await app.render(request, { addCookieHeader: true });

		assert.equal(response.status, 200);
		assert.match(response.headers.get('Set-Cookie')!, /my_cookie=value/);
	});
});
