import type { Plugin as VitePlugin } from 'vite';
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
	return {
		name: 'astro:integration-container',
		configureServer(server) {
			runHookServerSetup({ config: settings.config, server, logging });
		},
	};
}
