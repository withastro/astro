import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { redirectIsExternal, renderRedirect } from '../../../dist/core/redirects/render.js';
import { createMockRenderContext } from '../mocks.js';

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

			const response = await renderRedirect(renderContext);

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

			const response = await renderRedirect(renderContext);

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
					},
				},
			});

			const response = await renderRedirect(renderContext);

			assert.equal(response.status, 302);
		});

		it('encodes URIs properly', async () => {
			const renderContext = createMockRenderContext({
				routeData: {
					type: 'redirect',
					redirect: '/target with spaces',
				},
			});

			const response = await renderRedirect(renderContext);

			assert.equal(response.headers.get('location'), '/target%20with%20spaces');
		});

		it('handles external redirects', async () => {
			const renderContext = createMockRenderContext({
				routeData: {
					type: 'redirect',
					redirect: 'https://example.com',
				},
			});

			const response = await renderRedirect(renderContext);

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

			const response = await renderRedirect(renderContext);

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

			const response = await renderRedirect(renderContext);

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

			const response = await renderRedirect(renderContext);

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

			const response = await renderRedirect(renderContext);

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
					},
				},
			});

			const response = await renderRedirect(renderContext);

			assert.equal(response.headers.get('location'), '/target');
		});

		it('falls back to "/" when no redirect is defined', async () => {
			const renderContext = createMockRenderContext({
				routeData: {
					type: 'redirect',
					redirect: undefined,
				},
			});

			const response = await renderRedirect(renderContext);

			assert.equal(response.headers.get('location'), '/');
		});
	});
});
