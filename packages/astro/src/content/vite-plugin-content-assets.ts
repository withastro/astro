import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type * as vite from 'vite';
import { isRunnableDevEnvironment, type Plugin, type RunnableDevEnvironment } from 'vite';
import type { BuildInternals } from '../core/build/internal.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import { createViteLoader } from '../core/module-loader/vite.js';
import { wrapId } from '../core/util.js';
import type { AstroSettings } from '../types/astro.js';
import { isBuildableCSSRequest } from '../vite-plugin-astro-server/util.js';
import { crawlGraph } from '../vite-plugin-astro-server/vite.js';
import {
	CONTENT_IMAGE_FLAG,
	CONTENT_RENDER_FLAG,
	LINKS_PLACEHOLDER,
	PROPAGATED_ASSET_FLAG,
	STYLES_PLACEHOLDER,
} from './consts.js';
import { hasContentFlag } from './utils.js';
import { joinPaths, prependForwardSlash, slash } from '@astrojs/internal-helpers/path';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';

export function astroContentAssetPropagationPlugin({
	settings,
}: {
	settings: AstroSettings;
}): Plugin {
	let devModuleLoader: ModuleLoader;
	return {
		name: 'astro:content-asset-propagation',
		enforce: 'pre',
		resolveId: {
			filter: {
				id: new RegExp(`[?&](${CONTENT_IMAGE_FLAG}|${CONTENT_RENDER_FLAG})`),
			},
			async handler(id, importer, opts) {
				if (hasContentFlag(id, CONTENT_IMAGE_FLAG)) {
					const [base, query] = id.split('?');
					const params = new URLSearchParams(query);
					const importerParam = params.get('importer');

					const importerPath = importerParam
						? fileURLToPath(new URL(importerParam, settings.config.root))
						: importer;

					const resolved = await this.resolve(base, importerPath, { skipSelf: true, ...opts });
					if (!resolved) {
						throw new AstroError({
							...AstroErrorData.ImageNotFound,
							message: AstroErrorData.ImageNotFound.message(base),
						});
					}
					return resolved;
				}
				if (hasContentFlag(id, CONTENT_RENDER_FLAG)) {
					const base = id.split('?')[0];

					for (const { extensions, handlePropagation = true } of settings.contentEntryTypes) {
						if (handlePropagation && extensions.includes(extname(base))) {
							return this.resolve(`${base}?${PROPAGATED_ASSET_FLAG}`, importer, {
								skipSelf: true,
								...opts,
							});
						}
					}
					// Resolve to the base id (no content flags)
					// if Astro doesn't need to handle propagation.
					return this.resolve(base, importer, { skipSelf: true, ...opts });
				}
			},
		},
		configureServer(server) {
			if (!isRunnableDevEnvironment(server.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr])) {
				return;
			}
			devModuleLoader = createViteLoader(
				server,
				server.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr] as RunnableDevEnvironment,
			);
		},
		async transform(_, id, options) {
			if (hasContentFlag(id, PROPAGATED_ASSET_FLAG)) {
				const basePath = id.split('?')[0];
				let stringifiedLinks: string, stringifiedStyles: string;

				// We can access the server in dev,
				// so resolve collected styles and scripts here.
				if (options?.ssr && devModuleLoader) {
					if (!devModuleLoader.getModuleById(basePath)?.ssrModule) {
						await devModuleLoader.import(basePath);
					}
					const {
						styles,
						urls,
						crawledFiles: styleCrawledFiles,
					} = await getStylesForURL(basePath, devModuleLoader.getSSREnvironment());

					// Register files we crawled to be able to retrieve the rendered styles and scripts,
					// as when they get updated, we need to re-transform ourselves.
					// We also only watch files within the user source code, as changes in node_modules
					// are usually also ignored by Vite.
					for (const file of styleCrawledFiles) {
						if (!file.includes('node_modules')) {
							this.addWatchFile(file);
						}
					}

					stringifiedLinks = JSON.stringify([...urls]);
					stringifiedStyles = JSON.stringify(styles.map((s) => s.content));
				} else {
					// Otherwise, use placeholders to inject styles and scripts
					// during the production bundle step.
					// @see the `astro:content-build-plugin` below.
					stringifiedLinks = JSON.stringify(LINKS_PLACEHOLDER);
					stringifiedStyles = JSON.stringify(STYLES_PLACEHOLDER);
				}

				const code = `
					async function getMod() {
						return import(${JSON.stringify(basePath)});
					}
					const collectedLinks = ${stringifiedLinks};
					const collectedStyles = ${stringifiedStyles};
					const defaultMod = { __astroPropagation: true, getMod, collectedLinks, collectedStyles, collectedScripts: [] };
					export default defaultMod;
				`;
				// ^ Use a default export for tools like Markdoc
				// to catch the `__astroPropagation` identifier
				return { code, map: { mappings: '' } };
			}
		},
	};
}

interface ImportedDevStyle {
	id: string;
	url: string;
	content: string;
}
const INLINE_QUERY_REGEX = /(?:\?|&)inline(?:$|&)/;

/** Given a filePath URL, crawl Vite's module graph to find all style imports. */
async function getStylesForURL(
	filePath: string,
	environment: RunnableDevEnvironment,
): Promise<{ urls: Set<string>; styles: ImportedDevStyle[]; crawledFiles: Set<string> }> {
	const importedCssUrls = new Set<string>();
	// Map of url to injected style object. Use a `url` key to deduplicate styles
	const importedStylesMap = new Map<string, ImportedDevStyle>();
	const crawledFiles = new Set<string>();

	for await (const importedModule of crawlGraph(environment, filePath, false)) {
		if (importedModule.file) {
			crawledFiles.add(importedModule.file);
		}
		if (isBuildableCSSRequest(importedModule.url)) {
			// In dev, we inline all styles if possible
			let css = '';
			// If this is a plain CSS module, the default export should be a string
			if (typeof importedModule.ssrModule?.default === 'string') {
				css = importedModule.ssrModule.default;
			}
			// Else try to load it
			else {
				let modId = importedModule.url;
				// Mark url with ?inline so Vite will return the CSS as plain string, even for CSS modules
				if (!INLINE_QUERY_REGEX.test(importedModule.url)) {
					if (importedModule.url.includes('?')) {
						modId = importedModule.url.replace('?', '?inline&');
					} else {
						modId += '?inline';
					}
				}
				try {
					// The SSR module is possibly not loaded. Load it if it's null.
					const ssrModule = await environment.runner.import(modId);
					css = ssrModule.default;
				} catch {
					// The module may not be inline-able, e.g. SCSS partials. Skip it as it may already
					// be inlined into other modules if it happens to be in the graph.
					continue;
				}
			}

			importedStylesMap.set(importedModule.url, {
				id: wrapId(importedModule.id ?? importedModule.url),
				url: wrapId(importedModule.url),
				content: css,
			});
		}
	}

	return {
		urls: importedCssUrls,
		styles: [...importedStylesMap.values()],
		crawledFiles,
	};
}

/**
 * Post-build hook that injects propagated styles into content collection chunks.
 * Finds chunks with LINKS_PLACEHOLDER and STYLES_PLACEHOLDER, and replaces them
 * with actual styles from propagatedStylesMap.
 */
export async function contentAssetsBuildPostHook(
	base: string,
	internals: BuildInternals,
	{
		ssrOutputs,
		prerenderOutputs,
		mutate,
	}: {
		ssrOutputs: vite.Rollup.RollupOutput[];
		prerenderOutputs: vite.Rollup.RollupOutput[];
		mutate: (chunk: vite.Rollup.OutputChunk, envs: ['server'], code: string) => void;
	},
) {
	// Flatten all output chunks from both SSR and prerender builds
	const outputs = ssrOutputs
		.flatMap((o) => o.output)
		.concat(
			...(Array.isArray(prerenderOutputs) ? prerenderOutputs : [prerenderOutputs]).flatMap(
				(o) => o.output,
			),
		);

	// Process each chunk that contains placeholder placeholders for styles/links
	for (const chunk of outputs) {
		if (chunk.type !== 'chunk') continue;
		// Skip chunks that don't have content placeholders to inject
		if (!chunk.code.includes(LINKS_PLACEHOLDER)) continue;

		const entryStyles = new Set<string>();
		const entryLinks = new Set<string>();

		// For each module in this chunk, look up propagated styles from the map
		for (const id of chunk.moduleIds) {
			const entryCss = internals.propagatedStylesMap.get(id);
			if (entryCss) {
				// Collect both inline content and external links
				// TODO: Separating styles and links this way is not ideal. The `entryCss` list is order-sensitive
				// and splitting them into two sets causes the order to be lost, because styles are rendered after
				// links. Refactor this away in the future.
				for (const value of entryCss) {
					if (value.type === 'inline') entryStyles.add(value.content);
					if (value.type === 'external')
						entryLinks.add(prependForwardSlash(joinPaths(base, slash(value.src))));
				}
			}
		}

		// Replace placeholders with actual styles and links
		let newCode = chunk.code;
		if (entryStyles.size) {
			newCode = newCode.replace(
				JSON.stringify(STYLES_PLACEHOLDER),
				JSON.stringify(Array.from(entryStyles)),
			);
		} else {
			// Replace with empty array if no styles found
			newCode = newCode.replace(JSON.stringify(STYLES_PLACEHOLDER), '[]');
		}
		if (entryLinks.size) {
			newCode = newCode.replace(
				JSON.stringify(LINKS_PLACEHOLDER),
				JSON.stringify(Array.from(entryLinks)),
			);
		} else {
			// Replace with empty array if no links found
			newCode = newCode.replace(JSON.stringify(LINKS_PLACEHOLDER), '[]');
		}
		// Persist the mutation for writing to disk
		mutate(chunk as vite.Rollup.OutputChunk, ['server'], newCode);
	}
}
