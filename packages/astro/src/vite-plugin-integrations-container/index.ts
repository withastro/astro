import { normalizePath, type Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import type { LogOptions } from '../core/logger/core.js';
import { runHookServerSetup } from '../integrations/index.js';

/** Connect Astro integrations into Vite, as needed. */
export default function astroIntegrationsContainerPlugin({
	settings,
	logging,
}: {
	settings: AstroSettings;
	logging: LogOptions;
}): VitePlugin {
	let hasResolvedInjectedRoutes = false;
	return {
		name: 'astro:integration-container',
		configureServer(server) {
			runHookServerSetup({ config: settings.config, server, logging });
		},
		// Run `load` hook once just to get access to `PluginContext.resolve`
		// which allows us to resolve each injectedRoute entryPoint to a real file URL on disk
		async load() {
			if (hasResolvedInjectedRoutes) return;
			// Ensure the injectedRoutes are all resolved to their final paths through Rollup
			settings.resolvedInjectedRoutes = await Promise.all(settings.injectedRoutes.map(async injectedRoute => {
				let resolvedEntryPoint: URL | undefined;
				try {
					const resolvedId = await this.resolve(injectedRoute.entryPoint).then(res => res?.id ?? injectedRoute.entryPoint)
					const filename = normalizePath(resolvedId);
					resolvedEntryPoint = new URL(`file://${filename}`);
				} catch {}
				return { ...injectedRoute, resolvedEntryPoint }
			}))
			hasResolvedInjectedRoutes = true;
			return;
		},
	};
}
