import { Plugin as VitePlugin } from 'vite';
import { AstroConfig } from '../@types/astro.js';
import { LogOptions } from '../core/logger/core.js';
import { runHookServerSetup } from '../integrations/index.js';

/** Connect Astro integrations into Vite, as needed. */
export default function astroIntegrationsContainerPlugin({
	config,
	logging,
}: {
	config: AstroConfig;
	logging: LogOptions;
}): VitePlugin {
	return {
		name: 'astro:integration-container',
		configureServer(server) {
			runHookServerSetup({ config, server, logging });
		},
	};
}
