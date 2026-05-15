import { getContentEntryType } from './content-entry-type.js';
import { loadMarkdocConfig, SUPPORTED_MARKDOC_CONFIG_FILES } from './load-config.js';
function markdocIntegration(options) {
	let markdocConfigResult;
	let astroConfig;
	return {
		name: '@astrojs/markdoc',
		hooks: {
			'astro:config:setup': async (params) => {
				const { updateConfig, addContentEntryType } = params;
				astroConfig = params.config;
				markdocConfigResult = await loadMarkdocConfig(astroConfig);
				addContentEntryType(
					await getContentEntryType({ markdocConfigResult, astroConfig, options }),
				);
				updateConfig({
					vite: {
						ssr: {
							external: ['@astrojs/markdoc/prism', '@astrojs/markdoc/shiki'],
						},
					},
				});
			},
			'astro:server:setup': async ({ server }) => {
				server.watcher.on('all', (_event, entry) => {
					if (SUPPORTED_MARKDOC_CONFIG_FILES.some((f) => entry.endsWith(f))) {
						server.restart();
					}
				});
			},
		},
	};
}
export { markdocIntegration as default };
