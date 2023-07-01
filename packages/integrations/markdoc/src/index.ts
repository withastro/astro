/* eslint-disable no-console */
import type { AstroConfig, AstroIntegration, ContentEntryType, HookParameters } from 'astro';
import { bold, red } from 'kleur/colors';
import { fileURLToPath } from 'node:url';
import { normalizePath } from 'vite';
import { getContentEntryType } from './content-entry-type.js';
import {
	loadMarkdocConfig,
	SUPPORTED_MARKDOC_CONFIG_FILES,
	type MarkdocConfigResult,
} from './load-config.js';

type SetupHookParams = HookParameters<'astro:config:setup'> & {
	// `contentEntryType` is not a public API
	// Add type defs here
	addContentEntryType: (contentEntryType: ContentEntryType) => void;
};

export default function markdocIntegration(legacyConfig?: any): AstroIntegration {
	if (legacyConfig) {
		console.log(
			`${red(
				bold('[Markdoc]')
			)} Passing Markdoc config from your \`astro.config\` is no longer supported. Configuration should be exported from a \`markdoc.config.mjs\` file. See the configuration docs for more: https://docs.astro.build/en/guides/integrations-guide/markdoc/#configuration`
		);
		process.exit(0);
	}
	let markdocConfigResult: MarkdocConfigResult | undefined;
	let markdocConfigResultId = '';
	let astroConfig: AstroConfig;
	return {
		name: '@astrojs/markdoc',
		hooks: {
			'astro:config:setup': async (params) => {
				const { updateConfig, addContentEntryType } = params as SetupHookParams;
				astroConfig = params.config;

				markdocConfigResult = await loadMarkdocConfig(astroConfig);
				if (markdocConfigResult) {
					markdocConfigResultId = normalizePath(fileURLToPath(markdocConfigResult.fileUrl));
				}

				addContentEntryType(await getContentEntryType({ markdocConfigResult, astroConfig }));

				updateConfig({
					vite: {
						ssr: {
							external: ['@astrojs/markdoc/prism', '@astrojs/markdoc/shiki'],
						},
					},
				});
			},
			'astro:server:setup': async ({ server }) => {
				server.watcher.on('all', (event, entry) => {
					if (SUPPORTED_MARKDOC_CONFIG_FILES.some((f) => entry.endsWith(f))) {
						server.restart();
					}
				});
			},
		},
	};
}
