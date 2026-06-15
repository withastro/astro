import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FetchState } from '../../../dist/core/fetch/fetch-state.js';
import { createRouteData } from '../mocks.ts';
import { createBasicPipeline, SpyLogger } from '../test-utils.ts';

describe('FetchState with allowedDomains and prerendered routes', () => {
	it('does not access request.headers for prerendered routes', () => {
		const spy = new SpyLogger();
		const pipeline = createBasicPipeline({
			logger: spy,
			manifest: {
				allowedDomains: [{ hostname: 'example.com' }],
			},
		});

		const routeData = createRouteData({
			route: '/',
			prerender: true,
		});

		// Set up a request with a headers trap (mimics createRequest with isPrerendered: true)
		const request = new Request('http://localhost:4321/');
		let headersAccessed = false;
		const originalHeaders = request.headers;
		Object.defineProperty(request, 'headers', {
			get() {
				headersAccessed = true;
				return originalHeaders;
			},
		});

		new FetchState(pipeline, request, {
			routeData,
			addCookieHeader: false,
			clientAddress: undefined,
			locals: undefined,
			prerenderedErrorPageFetch: fetch,
			waitUntil: undefined,
		});

		assert.equal(
			headersAccessed,
			false,
			'request.headers should not be accessed for prerendered routes',
		);
	});

	it('accesses request.headers for non-prerendered routes when allowedDomains is set', () => {
		const spy = new SpyLogger();
		const pipeline = createBasicPipeline({
			logger: spy,
			manifest: {
				allowedDomains: [{ hostname: 'example.com' }],
			},
		});

		const routeData = createRouteData({
			route: '/',
			prerender: false,
		});

		const request = new Request('http://localhost:4321/');
		let headersAccessed = false;
		const originalHeaders = request.headers;
		Object.defineProperty(request, 'headers', {
			get() {
				headersAccessed = true;
				return originalHeaders;
			},
		});

		new FetchState(pipeline, request, {
			routeData,
			addCookieHeader: false,
			clientAddress: undefined,
			locals: undefined,
			prerenderedErrorPageFetch: fetch,
			waitUntil: undefined,
		});

		assert.equal(
			headersAccessed,
			true,
			'request.headers should be accessed for non-prerendered routes',
		);
	});
});
