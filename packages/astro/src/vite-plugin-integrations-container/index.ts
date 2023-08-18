import type { PluginContext } from 'rollup';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings, InjectedRoute, ResolvedInjectedRoute } from '../@types/astro.js';
import type { LogOptions } from '../core/logger/core.js';

import { normalizePath } from 'vite';
import { runHookServerSetup } from '../integrations/index.js';

/** Connect Astro integrations into Vite, as needed. */
export default function astroIntegrationsContainerPlugin({
	settings,
	logging,
}: {
	settings: AstroSettings;
	logging: LogOptions;
}): VitePlugin {
	return {
		name: 'astro:integration-container',
		async configureServer(server) {
			if (server.config.isProduction) return;
			await runHookServerSetup({ config: settings.config, server, logging });
		},
		async buildStart() {
			if (settings.injectedRoutes.length === settings.resolvedInjectedRoutes.length) return;
			// Ensure the injectedRoutes are all resolved to their final paths through Rollup
			settings.resolvedInjectedRoutes = await Promise.all(
				settings.injectedRoutes.map((route) => resolveEntryPoint.call(this, route))
			);
		},
	};
}

async function resolveEntryPoint(
	this: PluginContext,
	route: InjectedRoute
): Promise<ResolvedInjectedRoute> {
	const resolvedId = await this.resolve(route.entryPoint)
		.then((res) => res?.id)
		.catch(() => undefined);
	if (!resolvedId) return route;

	const resolvedEntryPoint = new URL(`file://${normalizePath(resolvedId)}`);
	return { ...route, resolvedEntryPoint };
}
