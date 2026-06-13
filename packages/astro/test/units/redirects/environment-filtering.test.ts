import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getRoutesForEnvironment } from '../../../dist/vite-plugin-pages/pages.js';
import { createRouteData } from '../mocks.ts';

describe('vite-plugin-pages / getRoutesForEnvironment — redirect targets', () => {
	// Bug #17060: prerendered redirect target pages were being bundled into the SSR
	// build environment, inflating the server function. Each scenario below asserts
	// that the redirect's target only lands in the page map for the environment that
	// matches its own prerender flag.

	it('SSR redirect → SSR target: target is included in SSR env, omitted from prerender env', () => {
		const target = createRouteData({ route: '/target', prerender: false });
		const redirect = createRouteData({
			route: '/old',
			type: 'redirect',
			redirect: { destination: '/target', status: 301 },
			redirectRoute: target,
			prerender: false,
		});

		const ssrResult = getRoutesForEnvironment([redirect], false);
		assert.equal(ssrResult.size, 2, 'SSR env includes the redirect and its target');
		assert.ok(ssrResult.has(target), 'target is in SSR env');
		assert.ok(ssrResult.has(redirect), 'redirect itself is in SSR env');

		const prerenderResult = getRoutesForEnvironment([redirect], true);
		assert.equal(prerenderResult.size, 0, 'prerender env includes neither');
	});

	it('SSR redirect → prerendered target: target is OMITTED from SSR env (regression for #17060)', () => {
		const target = createRouteData({ route: '/target', prerender: true });
		const redirect = createRouteData({
			route: '/old',
			type: 'redirect',
			redirect: { destination: '/target', status: 301 },
			redirectRoute: target,
			prerender: false,
		});

		const ssrResult = getRoutesForEnvironment([redirect], false);
		assert.equal(
			ssrResult.size,
			1,
			'SSR env includes only the redirect, not the prerendered target',
		);
		assert.ok(ssrResult.has(redirect), 'redirect is in SSR env');
		assert.ok(!ssrResult.has(target), 'prerendered target must not be bundled into SSR');

		const prerenderResult = getRoutesForEnvironment([redirect], true);
		assert.equal(prerenderResult.size, 1, 'prerender env includes only the target');
		assert.ok(prerenderResult.has(target), 'target is in prerender env');
	});

	it('prerendered redirect → prerendered target: target is in prerender env, omitted from SSR env', () => {
		const target = createRouteData({ route: '/target', prerender: true });
		const redirect = createRouteData({
			route: '/old',
			type: 'redirect',
			redirect: { destination: '/target', status: 301 },
			redirectRoute: target,
			prerender: true,
		});

		const ssrResult = getRoutesForEnvironment([redirect], false);
		assert.equal(ssrResult.size, 0, 'SSR env includes neither');

		const prerenderResult = getRoutesForEnvironment([redirect], true);
		assert.equal(prerenderResult.size, 2, 'prerender env includes the redirect and its target');
		assert.ok(prerenderResult.has(target), 'target is in prerender env');
		assert.ok(prerenderResult.has(redirect), 'redirect is in prerender env');
	});

	it('prerendered redirect → SSR target: target is in SSR env, omitted from prerender env', () => {
		const target = createRouteData({ route: '/target', prerender: false });
		const redirect = createRouteData({
			route: '/old',
			type: 'redirect',
			redirect: { destination: '/target', status: 301 },
			redirectRoute: target,
			prerender: true,
		});

		const ssrResult = getRoutesForEnvironment([redirect], false);
		assert.equal(ssrResult.size, 1, 'SSR env includes only the SSR target');
		assert.ok(ssrResult.has(target), 'SSR target is in SSR env');
		assert.ok(!ssrResult.has(redirect), 'prerendered redirect is not in SSR env');

		const prerenderResult = getRoutesForEnvironment([redirect], true);
		assert.equal(prerenderResult.size, 1, 'prerender env includes only the redirect');
		assert.ok(prerenderResult.has(redirect), 'redirect is in prerender env');
		assert.ok(!prerenderResult.has(target), 'SSR target must not be in prerender env');
	});
});
