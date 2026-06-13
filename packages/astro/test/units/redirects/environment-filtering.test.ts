import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getRoutesForEnvironment } from '../../../dist/vite-plugin-pages/pages.js';
import type { RouteData } from '../../../dist/types/public/internal.js';

describe('getRoutesForEnvironment', () => {
	it('does not include prerendered redirect targets in SSR routes', () => {
		const staticTarget = { component: 'src/pages/static-target.astro', prerender: true, type: 'page' } as RouteData;
		const ssrPage = { component: 'src/pages/ssr-page.astro', prerender: false, type: 'page' } as RouteData;
		const redirect = { component: '', prerender: false, type: 'redirect', redirectRoute: staticTarget } as RouteData;

		const ssrRoutes = getRoutesForEnvironment([staticTarget, ssrPage, redirect], false);

		// SSR routes should include the SSR page and the redirect itself
		assert.ok(ssrRoutes.has(ssrPage), 'SSR page should be in SSR routes');
		assert.ok(ssrRoutes.has(redirect), 'redirect route should be in SSR routes');
		// The prerendered target should NOT be in SSR routes
		assert.ok(!ssrRoutes.has(staticTarget), 'prerendered redirect target should not be in SSR routes');
	});

	it('includes prerendered redirect targets in prerender routes', () => {
		const staticTarget = { component: 'src/pages/static-target.astro', prerender: true, type: 'page' } as RouteData;
		const redirect = { component: '', prerender: true, type: 'redirect', redirectRoute: staticTarget } as RouteData;

		const prerenderRoutes = getRoutesForEnvironment([staticTarget, redirect], true);

		assert.ok(prerenderRoutes.has(staticTarget), 'prerendered target should be in prerender routes');
		assert.ok(prerenderRoutes.has(redirect), 'redirect should be in prerender routes');
	});

	it('includes SSR redirect targets in SSR routes', () => {
		const ssrTarget = { component: 'src/pages/ssr-target.astro', prerender: false, type: 'page' } as RouteData;
		const redirect = { component: '', prerender: false, type: 'redirect', redirectRoute: ssrTarget } as RouteData;

		const ssrRoutes = getRoutesForEnvironment([ssrTarget, redirect], false);

		assert.ok(ssrRoutes.has(ssrTarget), 'SSR target should be in SSR routes');
		assert.ok(ssrRoutes.has(redirect), 'redirect should be in SSR routes');
	});

	it('does not include SSR redirect targets in prerender routes', () => {
		const ssrTarget = { component: 'src/pages/ssr-target.astro', prerender: false, type: 'page' } as RouteData;
		const redirect = { component: '', prerender: true, type: 'redirect', redirectRoute: ssrTarget } as RouteData;

		const prerenderRoutes = getRoutesForEnvironment([ssrTarget, redirect], true);

		assert.ok(prerenderRoutes.has(redirect), 'redirect should be in prerender routes');
		assert.ok(!prerenderRoutes.has(ssrTarget), 'SSR target should not be in prerender routes');
	});
});
