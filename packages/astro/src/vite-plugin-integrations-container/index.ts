import { AstroConfig } from '../@types/astro.js';
import { runHookServerSetup } from '../integrations/index.js';
import { Plugin as VitePlugin, ResolvedConfig } from 'vite';

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
