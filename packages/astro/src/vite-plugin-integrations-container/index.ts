import type { PluginContext } from 'rollup';
import type { Plugin as VitePlugin, ViteDevServer } from 'vite';
import { normalizePath } from 'vite';
import type { AstroLogger } from '../core/logger/core.js';
import { runHookServerSetup } from '../integrations/hooks.js';
import type { AstroSettings } from '../types/astro.js';
import type { InternalInjectedRoute, ResolvedInjectedRoute } from '../types/public/internal.js';

/** Connect Astro integrations into Vite, as needed. */
export default function astroIntegrationsContainerPlugin({
	settings,
	logger,
}: {
	settings: AstroSettings;
	logger: AstroLogger;
}): VitePlugin {
	let server: ViteDevServer | undefined;
	return {
		name: 'astro:integration-container',
		async configureServer(_server) {
			server = _server;
			if (_server.config.isProduction) return;
			await runHookServerSetup({ config: settings.config, server: _server, logger });
		},
		async buildStart() {
			if (settings.injectedRoutes.length === settings.resolvedInjectedRoutes.length) return;
			settings.resolvedInjectedRoutes = await Promise.all(
				settings.injectedRoutes.map((route) => resolveEntryPoint(route, server, this)),
			);
		},
	};
}

async function resolveEntryPoint(
	route: InternalInjectedRoute,
	server: ViteDevServer | undefined,
	pluginContext: PluginContext,
): Promise<ResolvedInjectedRoute> {
	const entrypoint = route.entrypoint.toString();
	// In dev, resolve through the SSR environment's plugin container to avoid
	// triggering the client dep optimizer's registerMissingImport, which can
	// race against optimizer init and corrupt the metadata cache.
	// In build, this.resolve() is safe since there's no dep optimizer race.
	let resolvedId: string | undefined;
	if (server) {
		const resolved = await server.environments.ssr.pluginContainer.resolveId(entrypoint);
		resolvedId = resolved?.id;
	} else {
		resolvedId = await pluginContext
			.resolve(entrypoint)
			.then((res) => res?.id)
			.catch(() => undefined);
	}
	if (!resolvedId) return route;

	const resolvedEntryPoint = new URL(`file://${normalizePath(resolvedId)}`);
	return { ...route, resolvedEntryPoint };
}
