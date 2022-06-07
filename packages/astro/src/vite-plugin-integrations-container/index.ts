import { Plugin as VitePlugin } from 'vite';
import { AstroConfig } from '../@types/astro.js';
import { runHookServerSetup } from '../integrations/index.js';

/** Connect Astro integrations into Vite, as needed. */
export default function astroIntegrationsContainerPlugin({
	config,
}: {
	config: AstroConfig;
}): VitePlugin {
	return {
		name: 'astro:integration-container',
		configureServer(server) {
			runHookServerSetup({ config, server });
		},
	};
}
