import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import type { ComponentInstance } from '../../../dist/types/astro.js';
import type { RouteData } from '../../../dist/types/public/internal.js';
import { matchAllRoutes, matchRoute } from '../../../dist/core/routing/match.js';
import { matchRoute as devMatch } from '../../../dist/core/routing/dev.js';
import { setEnvironment } from '../../../dist/core/environment/index.js';
import { productionEnvironment } from '../../../dist/core/environment/production.js';
import { setLogger } from '../../../dist/core/logger/manifest-logger.js';
import { updateRouteTable } from '../../../dist/core/routing/route-table.js';
import { createRouteData } from '../mocks.ts';
import { defaultLogger } from '../test-utils.ts';
import { createManifest } from '../app/test-helpers.ts';
import { dynamicPart, staticPart } from './test-helpers.ts';

function sourceRoute(prerender = false) {
	const source = createRouteData({ route: '/start', prerender });
	source.fallbackRoutes.push(createRouteData({ route: '/es/start', type: 'fallback' }));
	return source;
}

function devManifest(
	routes: RouteData[],
	modules: Record<string, Pick<ComponentInstance, 'getStaticPaths'>> = {},
) {
	const manifest = createManifest({ serverLike: true });
	setLogger(manifest, defaultLogger);
	setEnvironment(manifest, {
		...productionEnvironment,
		name: 'test-dev',
		runtimeMode: 'development',
		async getComponentByRoute(_manifest, route) {
			return { default: createComponent(() => render``), ...modules[route.component] };
		},
	});
	updateRouteTable(manifest, routes);
	return manifest;
}

describe('#18530 matching i18n fallback routes in dev', () => {
	it('matches the same source through its own pattern and its fallback', () => {
		const source = sourceRoute();
		const manifest = { routes: [source] };
		assert.deepEqual(matchAllRoutes('/start', manifest), [source]);
		assert.deepEqual(matchAllRoutes('/es/start', manifest), [source]);
		assert.equal(matchRoute('/es/start', manifest), source);
		assert.deepEqual(matchAllRoutes('/es/missing', manifest), []);
	});

	it('preserves candidate order and returns a source at most once', () => {
		const source = sourceRoute();
		source.fallbackRoutes.push(createRouteData({ route: '/start', type: 'fallback' }));
		const localized = createRouteData({ route: '/es/start' });
		const manifest = { routes: [localized, source] };
		assert.deepEqual(matchAllRoutes('/es/start', manifest), [localized, source]);
		assert.deepEqual(matchAllRoutes('/start', manifest), [source]);
	});

	for (const prerender of [true, false]) {
		it(`dev resolves source metadata, not /404 (prerender=${prerender})`, async () => {
			const source = sourceRoute(prerender);
			const notFound = createRouteData({ route: '/404', prerender: true });
			const result = await devMatch(devManifest([source, notFound]), '/es/start');
			assert.equal(result?.route, source);
			assert.equal(result?.resolvedPathname, '/es/start');
			assert.equal(result?.route.prerender, prerender);
		});
	}

	it('does not let a prerendered 404 shadow a fallback to an SSR-only route', async () => {
		const source = sourceRoute(false);
		const notFound = createRouteData({ route: '/404', prerender: true });
		const result = await devMatch(devManifest([source, notFound]), '/es/start', {
			prerenderOnly: true,
		});
		assert.equal(result, undefined);
	});

	it('matches prerendered dynamic fallback params through getStaticPaths', async () => {
		const source = createRouteData({
			route: '/posts/[id]',
			segments: [[staticPart('posts')], [dynamicPart('id')]],
			prerender: true,
		});
		source.pathname = undefined;
		source.fallbackRoutes.push(
			createRouteData({
				route: '/es/posts/[id]',
				segments: [[staticPart('es')], [staticPart('posts')], [dynamicPart('id')]],
				type: 'fallback',
			}),
		);
		const notFound = createRouteData({ route: '/404' });
		const manifest = devManifest([source, notFound], {
			[source.component]: { getStaticPaths: () => [{ params: { id: 'hello' } }] },
		});
		assert.equal((await devMatch(manifest, '/es/posts/hello'))?.route, source);
		assert.equal((await devMatch(manifest, '/es/posts/missing'))?.route, notFound);
	});
});
