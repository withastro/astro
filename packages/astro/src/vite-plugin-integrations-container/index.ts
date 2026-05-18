import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type { Plugin as VitePlugin } from 'vite';
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
	return {
		name: 'astro:integration-container',
		async configureServer(server) {
			if (server.config.isProduction) return;
			await runHookServerSetup({ config: settings.config, server, logger });
		},
		buildStart() {
			if (settings.injectedRoutes.length === settings.resolvedInjectedRoutes.length) return;
			// Resolve injected routes using Node resolution instead of Vite's this.resolve()
			// to avoid triggering the client dep optimizer's registerMissingImport, which can
			// race against optimizer init and corrupt the cache.
			const require = createRequire(settings.config.root);
			settings.resolvedInjectedRoutes = settings.injectedRoutes.map((route) =>
				resolveEntryPoint(route, settings.config.root, require),
			);
		},
	};
}

function resolveEntryPoint(
	route: InternalInjectedRoute,
	root: URL,
	require: NodeRequire,
): ResolvedInjectedRoute {
	const entrypoint = route.entrypoint.toString();
	let resolved: string;
	try {
		resolved = require.resolve(entrypoint);
	} catch {
		resolved = fileURLToPath(new URL(entrypoint, root));
	}
	const resolvedEntryPoint = new URL(`file://${normalizePath(resolved)}`);
	return { ...route, resolvedEntryPoint };
}
