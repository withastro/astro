import { extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isRunnableDevEnvironment, type Plugin } from 'vite';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import { createViteLoader } from '../core/module-loader/vite.js';
import type { AstroSettings } from '../types/astro.js';
import { getStylesForURL } from '../vite-plugin-astro-server/css.js';
import {
	CONTENT_IMAGE_FLAG,
	CONTENT_RENDER_FLAG,
	LINKS_PLACEHOLDER,
	PROPAGATED_ASSET_FLAG,
	STYLES_PLACEHOLDER,
} from './consts.js';
import { hasContentFlag } from './utils.js';

export function astroContentAssetPropagationPlugin({
	settings,
}: {
	settings: AstroSettings;
}): Plugin {
	let devModuleLoader: ModuleLoader;
	return {
		name: 'astro:content-asset-propagation',
		enforce: 'pre',
		async resolveId(id, importer, opts) {
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
		configureServer(server) {
			if (!isRunnableDevEnvironment(server.environments.ssr)) {
				return;
			}
			devModuleLoader = createViteLoader(server, server.environments.ssr);
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
					} = await getStylesForURL(pathToFileURL(basePath), devModuleLoader);

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

