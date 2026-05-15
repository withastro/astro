import { normalizePath } from 'vite';
import { runHookServerSetup } from '../integrations/hooks.js';
function astroIntegrationsContainerPlugin({ settings, logger }) {
	return {
		name: 'astro:integration-container',
		async configureServer(server) {
			if (server.config.isProduction) return;
			await runHookServerSetup({ config: settings.config, server, logger });
		},
		async buildStart() {
			if (settings.injectedRoutes.length === settings.resolvedInjectedRoutes.length) return;
			settings.resolvedInjectedRoutes = await Promise.all(
				settings.injectedRoutes.map((route) => resolveEntryPoint.call(this, route)),
			);
		},
	};
}
async function resolveEntryPoint(route) {
	const resolvedId = await this.resolve(route.entrypoint.toString())
		.then((res) => res?.id)
		.catch(() => void 0);
	if (!resolvedId) return route;
	const resolvedEntryPoint = new URL(`file://${normalizePath(resolvedId)}`);
	return { ...route, resolvedEntryPoint };
}
export { astroIntegrationsContainerPlugin as default };
