import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	computeRedirectStatus,
	redirectIsExternal,
	renderRedirect,
	resolveRedirectTarget,
} from '../../../dist/core/redirects/render.js';
import { createMockRenderContext } from '../mocks.ts';

import type { RenderContext } from '../../../dist/core/render-context.js';
import type { RouteData } from '../../../dist/types/public/internal.js';

describe('redirects/render', () => {
	describe('redirectIsExternal', () => {
		it('returns true for http:// URLs', () => {
			assert.equal(redirectIsExternal('http://example.com'), true);
			assert.equal(redirectIsExternal('http://example.com/path'), true);
		});

		it('returns true for https:// URLs', () => {
			assert.equal(redirectIsExternal('https://example.com'), true);
			assert.equal(redirectIsExternal('https://example.com/path'), true);
		});

		it('returns false for relative URLs', () => {
			assert.equal(redirectIsExternal('/path'), false);
			assert.equal(redirectIsExternal('./path'), false);
			assert.equal(redirectIsExternal('../path'), false);
			assert.equal(redirectIsExternal('path'), false);
		});

		it('handles redirect objects with external destinations', () => {
			assert.equal(redirectIsExternal({ destination: 'https://example.com', status: 301 }), true);
			assert.equal(redirectIsExternal({ destination: 'http://example.com', status: 302 }), true);
		});

		it('handles redirect objects with relative destinations', () => {
			assert.equal(redirectIsExternal({ destination: '/path', status: 301 }), false);
			assert.equal(redirectIsExternal({ destination: './path', status: 302 }), false);
		});
	});

	describe('renderRedirect', () => {
		it('returns 301 for GET requests', async () => {
			const renderContext = createMockRenderContext({
				request: new Request('http://localhost/source'),
				routeData: {
					type: 'redirect',
					redirect: '/target',
				},
			});

			const response = await renderRedirect(renderContext as unknown as RenderContext);

			assert.equal(response.status, 301);
			assert.equal(response.headers.get('location'), '/target');
		});

		it('returns 308 for non-GET requests', async () => {
			const renderContext = createMockRenderContext({
				request: new Request('http://localhost/source', { method: 'POST' }),
				routeData: {
					type: 'redirect',
					redirect: '/target',
				},
			});

			const response = await renderRedirect(renderContext as unknown as RenderContext);

			assert.equal(response.status, 308);
			assert.equal(response.headers.get('location'), '/target');
		});

		it('handles redirect object with custom status', async () => {
			const renderContext = createMockRenderContext({
				routeData: {
					type: 'redirect',
					redirect: { destination: '/target', status: 302 },
					redirectRoute: {
						segments: [[{ content: 'target', dynamic: false, spread: false }]],
					} as unknown as RouteData,
				},
			});

			const response = await renderRedirect(renderContext as unknown as RenderContext);

			assert.equal(response.status, 302);
		});

		it('encodes URIs properly', async () => {
			const renderContext = createMockRenderContext({
				routeData: {
					type: 'redirect',
					redirect: '/target with spaces',
				},
			});

			const response = await renderRedirect(renderContext as unknown as RenderContext);

			assert.equal(response.headers.get('location'), '/target%20with%20spaces');
		});

		it('handles external redirects', async () => {
			const renderContext = createMockRenderContext({
				routeData: {
					type: 'redirect',
					redirect: 'https://example.com',
				},
			});

			const response = await renderRedirect(renderContext as unknown as RenderContext);

			assert.equal(response.status, 301);
			// External redirects use Response.redirect which sets the Location header differently
			assert.equal(response.headers.get('location'), 'https://example.com/');
		});

		it('substitutes single dynamic parameter', async () => {
			const renderContext = createMockRenderContext({
				routeData: {
					type: 'redirect',
					redirect: '/articles/[slug]',
				},
				params: { slug: 'my-post' },
			});

			const response = await renderRedirect(renderContext as unknown as RenderContext);

			assert.equal(response.headers.get('location'), '/articles/my-post');
		});

		it('substitutes multiple dynamic parameters', async () => {
			const renderContext = createMockRenderContext({
				routeData: {
					type: 'redirect',
					redirect: '/new/[param1]/[param2]',
				},
				params: { param1: 'foo', param2: 'bar' },
			});

			const response = await renderRedirect(renderContext as unknown as RenderContext);

			assert.equal(response.headers.get('location'), '/new/foo/bar');
		});

		it('substitutes spread parameters', async () => {
			const renderContext = createMockRenderContext({
				routeData: {
					type: 'redirect',
					redirect: '/new/[...rest]',
				},
				params: { rest: 'a/b/c' },
			});

			const response = await renderRedirect(renderContext as unknown as RenderContext);

			assert.equal(response.headers.get('location'), '/new/a/b/c');
		});

		it('encodes special characters in parameters', async () => {
			const renderContext = createMockRenderContext({
				routeData: {
					type: 'redirect',
					redirect: '/new/[city]',
				},
				params: { city: 'Las Vegas\u2019' },
			});

			const response = await renderRedirect(renderContext as unknown as RenderContext);

			assert.equal(response.headers.get('location'), '/new/Las%20Vegas%E2%80%99');
		});

		it('uses redirectRoute when available', async () => {
			const renderContext = createMockRenderContext({
				routeData: {
					type: 'redirect',
					redirect: '/not-used',
					redirectRoute: {
						segments: [[{ content: 'target', dynamic: false, spread: false }]],
						pathname: '/target',
					} as unknown as RouteData,
				},
			});

			const response = await renderRedirect(renderContext as unknown as RenderContext);

			assert.equal(response.headers.get('location'), '/target');
		});

		it('falls back to "/" when no redirect is defined', async () => {
			const renderContext = createMockRenderContext({
				routeData: {
					type: 'redirect',
					redirect: undefined,
				},
			});

			const response = await renderRedirect(renderContext as unknown as RenderContext);

			assert.equal(response.headers.get('location'), '/');
		});
	});
});

describe('computeRedirectStatus', () => {
	it('returns 301 for GET without an explicit status', () => {
		assert.equal(computeRedirectStatus('GET', '/destination', undefined), 301);
	});

	it('returns 308 for POST without an explicit status', () => {
		assert.equal(computeRedirectStatus('POST', '/destination', undefined), 308);
	});

	it('returns the explicit status when redirectRoute is defined and redirect is an object', () => {
		const redirectRoute = {} as RouteData;
		assert.equal(
			computeRedirectStatus('GET', { status: 302, destination: '/dest' }, redirectRoute),
			302,
		);
	});

	it('falls back to method-based status when redirect is a string even with redirectRoute', () => {
		const redirectRoute = {} as RouteData;
		assert.equal(computeRedirectStatus('POST', '/dest', redirectRoute), 308);
	});
});

describe('resolveRedirectTarget', () => {
	it('substitutes a simple param into the redirect string', () => {
		assert.equal(
			resolveRedirectTarget({ slug: 'hello' }, '/[slug]/page', undefined, 'ignore'),
			'/hello/page',
		);
	});

	it('substitutes a spread param', () => {
		assert.equal(
			resolveRedirectTarget({ rest: 'a/b/c' }, '/[...rest]', undefined, 'ignore'),
			'/a/b/c',
		);
	});

	it('returns the string as-is when there are no params', () => {
		assert.equal(resolveRedirectTarget({}, '/destination', undefined, 'ignore'), '/destination');
	});

	it('returns / when redirect is undefined', () => {
		assert.equal(resolveRedirectTarget({}, undefined, undefined, 'ignore'), '/');
	});

	it('returns the destination from an object redirect', () => {
		assert.equal(
			resolveRedirectTarget({}, { status: 301, destination: '/new' }, undefined, 'ignore'),
			'/new',
		);
	});

	it('returns an external URL unchanged', () => {
		assert.equal(
			resolveRedirectTarget({}, 'https://example.com/page', undefined, 'ignore'),
			'https://example.com/page',
		);
	});
});
