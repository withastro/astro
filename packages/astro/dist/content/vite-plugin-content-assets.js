import { extname } from 'node:path';
import { getAssetsPrefix } from '../assets/utils/getAssetsPrefix.js';
import { fileExtension } from '../core/path.js';
import { fileURLToPath } from 'node:url';
import { isRunnableDevEnvironment } from 'vite';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { wrapId } from '../core/util.js';
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
import { isAstroServerEnvironment } from '../environments.js';
function astroContentAssetPropagationPlugin({ settings }) {
	let environment = void 0;
	return {
		name: 'astro:content-asset-propagation',
		enforce: 'pre',
		resolveId: {
			filter: {
				id: new RegExp(`(?:\\?|&)(?:${CONTENT_IMAGE_FLAG}|${CONTENT_RENDER_FLAG})(?:&|=|$)`),
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
					resolved.id = `${resolved.id}?${CONTENT_IMAGE_FLAG}`;
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
					return this.resolve(base, importer, { skipSelf: true, ...opts });
				}
			},
		},
		configureServer(server) {
			const ssrEnv = server.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr];
			if (isRunnableDevEnvironment(ssrEnv)) {
				environment = ssrEnv;
			} else if (
				isRunnableDevEnvironment(server.environments[ASTRO_VITE_ENVIRONMENT_NAMES.astro])
			) {
				environment = server.environments[ASTRO_VITE_ENVIRONMENT_NAMES.astro];
			}
		},
		transform: {
			filter: {
				id: new RegExp(`(?:\\?|&)${PROPAGATED_ASSET_FLAG}(?:&|=|$)`),
			},
			async handler(_, id) {
				if (hasContentFlag(id, PROPAGATED_ASSET_FLAG)) {
					const basePath = id.split('?')[0];
					let stringifiedLinks, stringifiedStyles;
					if (isAstroServerEnvironment(this.environment) && environment) {
						if (!environment.moduleGraph.getModuleById(basePath)?.ssrModule) {
							await environment.runner.import(basePath).catch(() => {});
						}
						const {
							styles,
							urls,
							crawledFiles: styleCrawledFiles,
						} = await getStylesForURL(basePath, environment);
						for (const file of styleCrawledFiles) {
							if (!file.includes('node_modules')) {
								this.addWatchFile(file);
							}
						}
						stringifiedLinks = JSON.stringify([...urls]);
						stringifiedStyles = JSON.stringify(styles.map((s) => s.content));
					} else {
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
					return { code, map: { mappings: '' } };
				}
			},
		},
	};
}
const INLINE_QUERY_REGEX = /(?:\?|&)inline(?:$|&)/;
async function getStylesForURL(filePath, environment) {
	const importedCssUrls = /* @__PURE__ */ new Set();
	const importedStylesMap = /* @__PURE__ */ new Map();
	const crawledFiles = /* @__PURE__ */ new Set();
	for await (const importedModule of crawlGraph(environment, filePath, false)) {
		if (importedModule.file) {
			crawledFiles.add(importedModule.file);
		}
		if (isBuildableCSSRequest(importedModule.url)) {
			let css = '';
			if (typeof importedModule.ssrModule?.default === 'string') {
				css = importedModule.ssrModule.default;
			} else {
				let modId = importedModule.url;
				if (!INLINE_QUERY_REGEX.test(importedModule.url)) {
					if (importedModule.url.includes('?')) {
						modId = importedModule.url.replace('?', '?inline&');
					} else {
						modId += '?inline';
					}
				}
				try {
					const ssrModule = await environment.runner.import(modId);
					css = ssrModule.default;
				} catch {
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
async function contentAssetsBuildPostHook(base, assetsPrefix, internals, { chunks, mutate }) {
	for (const chunk of chunks) {
		if (!chunk.code.includes(LINKS_PLACEHOLDER)) continue;
		const entryStyles = /* @__PURE__ */ new Set();
		const entryLinks = /* @__PURE__ */ new Set();
		for (const id of chunk.moduleIds) {
			const entryCss = internals.propagatedStylesMap.get(id);
			if (entryCss) {
				for (const value of entryCss) {
					if (value.type === 'inline') entryStyles.add(value.content);
					if (value.type === 'external') {
						let href;
						if (assetsPrefix) {
							const pf = getAssetsPrefix(fileExtension(value.src), assetsPrefix);
							href = joinPaths(pf, slash(value.src));
						} else {
							href = prependForwardSlash(joinPaths(base, slash(value.src)));
						}
						entryLinks.add(href);
					}
				}
			}
		}
		let newCode = chunk.code;
		if (entryStyles.size) {
			newCode = newCode.replace(
				JSON.stringify(STYLES_PLACEHOLDER),
				JSON.stringify(Array.from(entryStyles)),
			);
		} else {
			newCode = newCode.replace(JSON.stringify(STYLES_PLACEHOLDER), '[]');
		}
		if (entryLinks.size) {
			newCode = newCode.replace(
				JSON.stringify(LINKS_PLACEHOLDER),
				JSON.stringify(Array.from(entryLinks)),
			);
		} else {
			newCode = newCode.replace(JSON.stringify(LINKS_PLACEHOLDER), '[]');
		}
		mutate(chunk.fileName, newCode, chunk.prerender);
	}
}
export { astroContentAssetPropagationPlugin, contentAssetsBuildPostHook };
