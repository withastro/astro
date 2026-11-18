import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createEndpoint, createTestApp, createPage, createRouteData } from '../mocks.ts';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { dynamicPart, staticPart } from '../routing/test-helpers.ts';

import type { APIContext } from '../../../dist/types/public/context.js';

/**
 * Tests for SSR API route behavior through the App pipeline.
 *
 * Covers: GET/POST endpoints, JSON responses, custom status codes,
 * HEAD requests, API context shape, binary form data, and status text.
 *
 * Migrated from the integration test in test/ssr-api-route.test.ts.
 */

// #region Route factories

const noopPage = createComponent(
	() => render`<html><head><title>Testing</title></head><body><h1>Testing</h1></body></html>`,
);

function foodEndpoint() {
	return createEndpoint(
		{
			GET: () =>
				new Response(
					JSON.stringify([{ name: 'lettuce' }, { name: 'broccoli' }, { name: 'pizza' }]),
					{ status: 200, statusText: 'tasty' },
				),
			POST: async (ctx: APIContext) => {
				const body = await ctx.request.text();
				const ok = body === 'some data';
				return new Response(ok ? 'ok' : 'not ok', {
					status: ok ? 200 : 400,
					statusText: ok ? 'ok' : 'not ok',
				});
			},
		},
		{ route: '/food.json' },
	);
}

function contextEndpoint() {
	const routeData = createRouteData({
		route: '/context/[param]',
		type: 'endpoint',
		segments: [[staticPart('context')], [dynamicPart('param')]],
		pathname: undefined,
	});
	return {
		routeData,
		module: async () => ({
			page: async () => ({
				GET: (ctx: APIContext) =>
					Response.json({
						cookiesExist: !!ctx.cookies,
						requestExist: !!ctx.request,
						redirectExist: !!ctx.redirect,
						propsExist: !!ctx.props,
						params: ctx.params,
						site: ctx.site?.toString(),
						generator: ctx.generator,
						url: ctx.url.toString(),
						clientAddress: ctx.clientAddress,
					}),
			}),
		}),
	};
}

function customStatusEndpoint() {
	return createEndpoint(
		{
			GET: () =>
				new Response('hello world', {
					status: 403,
					headers: { 'x-hello': 'world' },
				}),
		},
		{ route: '/custom-status' },
	);
}

function binaryEndpoint() {
	return createEndpoint(
		{
			POST: async (ctx: APIContext) => {
				const data = await ctx.request.formData();
				const file = data.get('file') as File | null;
				if (file) {
					const buffer = await file.arrayBuffer();
					if (buffer.byteLength > 0) {
						return new Response('ok', { status: 200 });
					}
				}
				return new Response(null, { status: 400 });
			},
		},
		{ route: '/binary' },
	);
}

// #endregion

// #region Tests

describe('SSR API routes', () => {
	const app = createTestApp(
		[
			createPage(noopPage, { route: '/' }),
			foodEndpoint(),
			contextEndpoint() as any,
			customStatusEndpoint(),
			binaryEndpoint(),
		],
		{ site: 'https://mysite.dev/subsite/' },
	);

	it('basic pages work', async () => {
		const response = await app.render(new Request('http://example.com/'));
		const html = await response.text();
		assert.notEqual(html, '');
	});

	it('can load a JSON API route', async () => {
		const response = await app.render(new Request('http://example.com/food.json'));
		assert.equal(response.status, 200);
		assert.equal(response.statusText, 'tasty');
		const body = await response.json();
		assert.equal(body.length, 3);
	});

	it('has valid API context', async () => {
		const response = await app.render(new Request('http://example.com/context/any'), {
			clientAddress: '0.0.0.0',
		});
		assert.equal(response.status, 200);
		const data = await response.json();
		assert.equal(data.cookiesExist, true);
		assert.equal(data.requestExist, true);
		assert.equal(data.redirectExist, true);
		assert.equal(data.propsExist, true);
		assert.deepEqual(data.params, { param: 'any' });
		assert.match(data.generator, /^Astro v/);
		assert.equal(data.url, 'http://example.com/context/any');
		assert.equal(data.clientAddress, '0.0.0.0');
		assert.equal(data.site, 'https://mysite.dev/subsite/');
	});

	it('can POST to API routes', async () => {
		const response = await app.render(
			new Request('http://example.com/food.json', {
				method: 'POST',
				body: 'some data',
			}),
		);
		assert.equal(response.status, 200);
		const text = await response.text();
		assert.equal(text, 'ok');
	});

	it('can read custom status text from API routes', async () => {
		const response = await app.render(
			new Request('http://example.com/food.json', {
				method: 'POST',
				body: 'not some data',
			}),
		);
		assert.equal(response.status, 400);
		assert.equal(response.statusText, 'not ok');
		const text = await response.text();
		assert.equal(text, 'not ok');
	});

	it('can be passed binary data from multipart formdata', async () => {
		const formData = new FormData();
		const file = new File([new Uint8Array([1, 2, 3, 4])], 'test.bin', {
			type: 'application/octet-stream',
		});
		formData.set('file', file, 'test.bin');
		const response = await app.render(
			new Request('http://example.com/binary', {
				method: 'POST',
				body: formData,
			}),
		);
		assert.equal(response.status, 200);
	});

	describe('custom status', () => {
		it('returns a custom status code and empty body for HEAD', async () => {
			const response = await app.render(
				new Request('http://example.com/custom-status', { method: 'HEAD' }),
			);
			const text = await response.text();
			assert.equal(response.status, 403);
			assert.equal(text, '');
		});

		it('returns a 403 status code with the correct body for GET', async () => {
			const response = await app.render(new Request('http://example.com/custom-status'));
			const text = await response.text();
			assert.equal(response.status, 403);
			assert.equal(text, 'hello world');
		});

		it('returns the correct headers for GET', async () => {
			const response = await app.render(new Request('http://example.com/custom-status'));
			assert.equal(response.headers.get('x-hello'), 'world');
		});

		it('returns the correct headers for HEAD', async () => {
			const response = await app.render(
				new Request('http://example.com/custom-status', { method: 'HEAD' }),
			);
			assert.equal(response.headers.get('x-hello'), 'world');
		});
	});
});

// #endregion
