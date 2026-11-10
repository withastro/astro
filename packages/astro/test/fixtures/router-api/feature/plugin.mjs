import { getRouterApi } from '@astrojs/vite-plugin-router';

const DATA_ID = 'virtual:test-feature/data';

/**
 * A feature built only on `api.astroRouter`: a route, a fetch handler, a manifest module, manifest
 * data, a routing extension, a route table transform and a render context key. Records what the
 * route table and build-done callbacks receive on
 * `globalThis.__routerApiFeature` for the test to read.
 */
export default function feature() {
	const record = (globalThis.__routerApiFeature ??= {});
	return {
		name: 'test-feature',
		configResolved(config) {
			const api = getRouterApi(config);
			api.injectRoute({
				pattern: '/injected',
				entrypoint: new URL('./injected.astro', import.meta.url),
			});
			api.addFetchHandler('feature', {
				entrypoint: new URL('./handler.mjs', import.meta.url),
				order: 'pre',
			});
			api.extendManifest('featureData', DATA_ID);
			api.setManifestData('greetingWord', 'Hello');
			api.extendRouting(new URL('./routing.mjs', import.meta.url));
			api.extendRenderContext('greeting', new URL('./greeting.mjs', import.meta.url));
			api.transformRoutes((routes, context) => {
				record.transformed = { routes: routes.map((route) => route.route), context };
				return routes.filter((route) => route.route !== '/removed');
			});
			api.onRoutesResolved((routes) => {
				record.routes = routes.map((route) => route.route);
			});
			api.onBuildDone((result) => {
				record.buildDone = result;
			});
			api.onPrerenderDone(({ prerenderer }) => {
				record.prerenderDone = { prerenderer: prerenderer?.name };
			});
		},
		resolveId(id) {
			if (id === DATA_ID) return '\0' + DATA_ID;
		},
		load(id) {
			if (id === '\0' + DATA_ID) return 'export default "from the manifest";';
		},
	};
}
