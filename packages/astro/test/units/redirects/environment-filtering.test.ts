import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getRoutesForEnvironment } from '../../../dist/vite-plugin-pages/pages.js';
import type { RouteData } from '../../../dist/types/public/internal.js';

describe('getRoutesForEnvironment', () => {
	it('does not include prerendered redirect targets in SSR routes', () => {
		const staticTarget = { component: 'src/pages/target.astro', prerender: true } as RouteData;
		const ssrRedirect = {
			component: '/old',
			prerender: false,
			type: 'redirect',
			redirectRoute: staticTarget,
		} as RouteData;

		const ssrRoutes = getRoutesForEnvironment([staticTarget, ssrRedirect], false);

		assert.ok(ssrRoutes.has(ssrRedirect), 'SSR redirect should be in SSR routes');
		assert.ok(!ssrRoutes.has(staticTarget), 'prerendered target should NOT be in SSR routes');
	});

	it('includes prerendered redirect targets in prerender routes', () => {
		const staticTarget = { component: 'src/pages/target.astro', prerender: true } as RouteData;
		const staticRedirect = {
			component: '/old',
			prerender: true,
			type: 'redirect',
			redirectRoute: staticTarget,
		} as RouteData;

		const prerenderRoutes = getRoutesForEnvironment([staticTarget, staticRedirect], true);

		assert.ok(
			prerenderRoutes.has(staticRedirect),
			'prerendered redirect should be in prerender routes',
		);
		assert.ok(
			prerenderRoutes.has(staticTarget),
			'prerendered target should be in prerender routes',
		);
	});

	it('includes SSR redirect targets in SSR routes', () => {
		const ssrTarget = { component: 'src/pages/target.astro', prerender: false } as RouteData;
		const ssrRedirect = {
			component: '/old',
			prerender: false,
			type: 'redirect',
			redirectRoute: ssrTarget,
		} as RouteData;

		const ssrRoutes = getRoutesForEnvironment([ssrTarget, ssrRedirect], false);

		assert.ok(ssrRoutes.has(ssrRedirect), 'SSR redirect should be in SSR routes');
		assert.ok(ssrRoutes.has(ssrTarget), 'SSR target should be in SSR routes');
	});

	it('does not include SSR redirect targets in prerender routes', () => {
		const ssrTarget = { component: 'src/pages/target.astro', prerender: false } as RouteData;
		const prerenderRedirect = {
			component: '/old',
			prerender: true,
			type: 'redirect',
			redirectRoute: ssrTarget,
		} as RouteData;

		const prerenderRoutes = getRoutesForEnvironment([ssrTarget, prerenderRedirect], true);

		assert.ok(
			prerenderRoutes.has(prerenderRedirect),
			'prerendered redirect should be in prerender routes',
		);
		assert.ok(!prerenderRoutes.has(ssrTarget), 'SSR target should NOT be in prerender routes');
	});
});
