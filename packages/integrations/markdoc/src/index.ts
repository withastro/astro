/* eslint-disable no-console */
import type { AstroIntegration, ContentEntryType, HookParameters, AstroConfig } from 'astro';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { hasContentFlag, PROPAGATED_ASSET_FLAG } from './utils.js';
import { bold, red } from 'kleur/colors';
import path from 'node:path';
import type * as rollup from 'rollup';
import { normalizePath } from 'vite';
import {
	loadMarkdocConfig,
	type MarkdocConfigResult,
	SUPPORTED_MARKDOC_CONFIG_FILES,
} from './load-config.js';
import { getContentEntryType } from './content-entry-type.js';

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

				let rollupOptions: rollup.RollupOptions = {};
				if (markdocConfigResult) {
					rollupOptions = {
						output: {
							// Split Astro components from your `markdoc.config`
							// to only inject component styles and scripts at runtime.
							manualChunks(id, { getModuleInfo }) {
								if (
									markdocConfigResult &&
									hasContentFlag(id, PROPAGATED_ASSET_FLAG) &&
									getModuleInfo(id)?.importers?.includes(markdocConfigResultId)
								) {
									return createNameHash(id, [id]);
								}
							},
						},
					};
				}

				updateConfig({
					vite: {
						ssr: {
							external: ['@astrojs/markdoc/prism', '@astrojs/markdoc/shiki'],
						},
						build: {
							rollupOptions,
						},
						plugins: [
							{
								name: '@astrojs/markdoc:astro-propagated-assets',
								enforce: 'pre',
								// Astro component styles and scripts should only be injected
								// When a given Markdoc file actually uses that component.
								// Add the `astroPropagatedAssets` flag to inject only when rendered.
								resolveId(this: rollup.TransformPluginContext, id: string, importer: string) {
									if (importer === markdocConfigResultId && id.endsWith('.astro')) {
										return this.resolve(id + '?astroPropagatedAssets', importer, {
											skipSelf: true,
										});
									}
								},
							},
						],
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

/**
 * Create build hash for manual Rollup chunks.
 * @see 'packages/astro/src/core/build/plugins/plugin-css.ts'
 */
function createNameHash(baseId: string, hashIds: string[]): string {
	const baseName = baseId ? path.parse(baseId).name : 'index';
	const hash = crypto.createHash('sha256');
	for (const id of hashIds) {
		hash.update(id, 'utf-8');
	}
	const h = hash.digest('hex').slice(0, 8);
	const proposedName = baseName + '.' + h;
	return proposedName;
}
