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
		async resolveId(id, importer, options) {
			if (id.startsWith('virtual:@astrojs/') && id.endsWith('/app')) {
				const rendererName = id.slice('virtual:'.length, '/app'.length * -1);
				const match = config._ctx.renderers.find(({ name }) => name === rendererName);
				if (match && match.appEntrypoint) {
					const app = await this.resolve(match.appEntrypoint, importer, { ...options, skipSelf: true });
					return app;
				}
				return id.slice('virtual:'.length)
			}
		}
	};
}
