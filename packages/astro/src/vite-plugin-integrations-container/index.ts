import { Plugin as VitePlugin } from 'vite';
import { AstroSettings } from '../@types/astro.js';
import { LogOptions } from '../core/logger/core.js';
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
