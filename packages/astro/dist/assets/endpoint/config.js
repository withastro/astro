import { resolveInjectedRoute } from '../../core/routing/create-manifest.js';
import { parseRoute } from '../../core/routing/parse-route.js';
function injectImageEndpoint(settings, manifest, mode, cwd) {
	manifest.routes.unshift(getImageEndpointData(settings, mode, cwd));
}
function getImageEndpointData(settings, mode, cwd) {
	const endpointEntrypoint =
		settings.config.image.endpoint.entrypoint === void 0
			? mode === 'dev'
				? 'astro/assets/endpoint/dev'
				: 'astro/assets/endpoint/generic'
			: settings.config.image.endpoint.entrypoint;
	const component = resolveInjectedRoute(endpointEntrypoint, settings.config.root, cwd).component;
	return parseRoute(settings.config.image.endpoint.route, settings, {
		component,
		type: 'endpoint',
		origin: 'internal',
		isIndex: false,
		prerender: false,
		params: [],
	});
}
export { injectImageEndpoint };
