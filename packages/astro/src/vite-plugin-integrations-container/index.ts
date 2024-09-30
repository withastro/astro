import type { PluginContext } from 'rollup';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings, InjectedRoute, ResolvedInjectedRoute } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';

import { normalizePath } from 'vite';
import { runHookServerSetup } from '../integrations/hooks.js';

/** Connect Astro integrations into Vite, as needed. */
export default function astroIntegrationsContainerPlugin({
	settings,
	logger,
}: {
	settings: AstroSettings;
	logger: Logger;
}): VitePlugin {
	return {
		name: 'astro:integration-container',
		async configureServer(server) {
			if (server.config.isProduction) return;
			await runHookServerSetup({ config: settings.config, server, logger });
		},
		async buildStart() {
			if (settings.injectedRoutes.length === settings.resolvedInjectedRoutes.length) return;
			// Ensure the injectedRoutes are all resolved to their final paths through Rollup
			settings.resolvedInjectedRoutes = await Promise.all(
				settings.injectedRoutes.map((route) => resolveEntryPoint.call(this, route)),
			);
		},
	};
}

async function resolveEntryPoint(
	this: PluginContext,
	route: InjectedRoute,
): Promise<ResolvedInjectedRoute> {
	const resolvedId = await this.resolve(route.entrypoint)
		.then((res) => res?.id)
		.catch(() => undefined);
	if (!resolvedId) return route;

	const resolvedEntryPoint = new URL(`file://${normalizePath(resolvedId)}`);
	return { ...route, resolvedEntryPoint };
}
