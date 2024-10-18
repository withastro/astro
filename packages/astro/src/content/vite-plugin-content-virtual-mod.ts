import nodeFs from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dataToEsm } from '@rollup/pluginutils';
import glob from 'fast-glob';
import pLimit from 'p-limit';
import type { Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { encodeName } from '../core/build/util.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { appendForwardSlash, removeFileExtension } from '../core/path.js';
import { isServerLikeOutput } from '../core/util.js';
import { rootRelativePath } from '../core/viteUtils.js';
import type { AstroPluginMetadata } from '../vite-plugin-astro/index.js';
import { createDefaultAstroMetadata } from '../vite-plugin-astro/metadata.js';
import {
	ASSET_IMPORTS_FILE,
	ASSET_IMPORTS_RESOLVED_STUB_ID,
	ASSET_IMPORTS_VIRTUAL_ID,
	CONTENT_FLAG,
	CONTENT_RENDER_FLAG,
	DATA_FLAG,
	DATA_STORE_VIRTUAL_ID,
	MODULES_IMPORTS_FILE,
	MODULES_MJS_ID,
	MODULES_MJS_VIRTUAL_ID,
	RESOLVED_DATA_STORE_VIRTUAL_ID,
	RESOLVED_VIRTUAL_MODULE_ID,
	VIRTUAL_MODULE_ID,
} from './consts.js';
import { getDataStoreFile } from './content-layer.js';
import {
	type ContentLookupMap,
	getContentEntryIdAndSlug,
	getContentPaths,
	getDataEntryExts,
	getDataEntryId,
	getEntryCollectionName,
	getEntryConfigByExtMap,
	getEntrySlug,
	getEntryType,
	getExtGlob,
	isDeferredModule,
} from './utils.js';

interface AstroContentVirtualModPluginParams {
	settings: AstroSettings;
	fs: typeof nodeFs;
}

export function astroContentVirtualModPlugin({
	settings,
	fs,
}: AstroContentVirtualModPluginParams): Plugin {
	let IS_DEV = false;
	const IS_SERVER = isServerLikeOutput(settings.config);
	let dataStoreFile: URL;
	return {
		name: 'astro-content-virtual-mod-plugin',
		enforce: 'pre',
		configResolved(config) {
			IS_DEV = config.mode === 'development';
			dataStoreFile = getDataStoreFile(settings, IS_DEV);
		},
		async resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				if (!settings.config.experimental.contentCollectionCache) {
					return RESOLVED_VIRTUAL_MODULE_ID;
				}
				if (IS_DEV || IS_SERVER) {
					return RESOLVED_VIRTUAL_MODULE_ID;
				} else {
					// For SSG (production), we will build this file ourselves
					return { id: RESOLVED_VIRTUAL_MODULE_ID, external: true };
				}
			}
			if (id === DATA_STORE_VIRTUAL_ID) {
				return RESOLVED_DATA_STORE_VIRTUAL_ID;
			}

			if (isDeferredModule(id)) {
				const [, query] = id.split('?');
				const params = new URLSearchParams(query);
				const fileName = params.get('fileName');
				let importPath = undefined;
				if (fileName && URL.canParse(fileName, settings.config.root.toString())) {
					importPath = fileURLToPath(new URL(fileName, settings.config.root));
				}
				if (importPath) {
					return await this.resolve(`${importPath}?${CONTENT_RENDER_FLAG}`);
				}
			}

			if (id === MODULES_MJS_ID) {
				const modules = new URL(MODULES_IMPORTS_FILE, settings.dotAstroDir);
				if (fs.existsSync(modules)) {
					return fileURLToPath(modules);
				}
				return MODULES_MJS_VIRTUAL_ID;
			}

			if (id === ASSET_IMPORTS_VIRTUAL_ID) {
				const assetImportsFile = new URL(ASSET_IMPORTS_FILE, settings.dotAstroDir);
				if (fs.existsSync(assetImportsFile)) {
					return fileURLToPath(assetImportsFile);
				}
				return ASSET_IMPORTS_RESOLVED_STUB_ID;
			}
		},
		async load(id, args) {
			if (id === RESOLVED_VIRTUAL_MODULE_ID) {
				const lookupMap = await generateLookupMap({
					settings,
					fs,
				});
				const isClient = !args?.ssr;
				const code = await generateContentEntryFile({
					settings,
					fs,
					lookupMap,
					IS_DEV,
					IS_SERVER,
					isClient,
				});

				const astro = createDefaultAstroMetadata();
				astro.propagation = 'in-tree';
				return {
					code,
					meta: {
						astro,
					} satisfies AstroPluginMetadata,
				};
			}
			if (id === RESOLVED_DATA_STORE_VIRTUAL_ID) {
				if (!fs.existsSync(dataStoreFile)) {
					return 'export default new Map()';
				}
				const jsonData = await fs.promises.readFile(dataStoreFile, 'utf-8');

				try {
					const parsed = JSON.parse(jsonData);
					return {
						code: dataToEsm(parsed, {
							compact: true,
						}),
						map: { mappings: '' },
					};
				} catch (err) {
					const message = 'Could not parse JSON file';
					this.error({ message, id, cause: err });
				}
			}

			if (id === ASSET_IMPORTS_RESOLVED_STUB_ID) {
				const assetImportsFile = new URL(ASSET_IMPORTS_FILE, settings.dotAstroDir);
				if (!fs.existsSync(assetImportsFile)) {
					return 'export default new Map()';
				}
				return fs.readFileSync(assetImportsFile, 'utf-8');
			}

			if (id === MODULES_MJS_VIRTUAL_ID) {
				const modules = new URL(MODULES_IMPORTS_FILE, settings.dotAstroDir);
				if (!fs.existsSync(modules)) {
					return 'export default new Map()';
				}
				return fs.readFileSync(modules, 'utf-8');
			}
		},
		renderChunk(code, chunk) {
			if (!settings.config.experimental.contentCollectionCache) {
				return;
			}
			if (code.includes(RESOLVED_VIRTUAL_MODULE_ID)) {
				const depth = chunk.fileName.split('/').length - 1;
				const prefix = depth > 0 ? '../'.repeat(depth) : './';
				return code.replaceAll(RESOLVED_VIRTUAL_MODULE_ID, `${prefix}content/entry.mjs`);
			}
		},

		configureServer(server) {
			const dataStorePath = fileURLToPath(dataStoreFile);

			server.watcher.add(dataStorePath);

			function invalidateDataStore() {
				const module = server.moduleGraph.getModuleById(RESOLVED_DATA_STORE_VIRTUAL_ID);
				if (module) {
					server.moduleGraph.invalidateModule(module);
				}
				server.ws.send({
					type: 'full-reload',
					path: '*',
				});
			}

			// If the datastore file changes, invalidate the virtual module

			server.watcher.on('add', (addedPath) => {
				if (addedPath === dataStorePath) {
					invalidateDataStore();
				}
			});

			server.watcher.on('change', (changedPath) => {
				if (changedPath === dataStorePath) {
					invalidateDataStore();
				}
			});
		},
	};
}

export async function generateContentEntryFile({
	settings,
	lookupMap,
	IS_DEV,
	IS_SERVER,
	isClient,
}: {
	settings: AstroSettings;
	fs: typeof nodeFs;
	lookupMap: ContentLookupMap;
	IS_DEV: boolean;
	IS_SERVER: boolean;
	isClient: boolean;
}) {
	const contentPaths = getContentPaths(settings.config);
	const relContentDir = rootRelativePath(settings.config.root, contentPaths.contentDir);

	let contentEntryGlobResult: string;
	let dataEntryGlobResult: string;
	let renderEntryGlobResult: string;
	if (IS_DEV || IS_SERVER || !settings.config.experimental.contentCollectionCache) {
		const contentEntryConfigByExt = getEntryConfigByExtMap(settings.contentEntryTypes);
		const contentEntryExts = [...contentEntryConfigByExt.keys()];
		const dataEntryExts = getDataEntryExts(settings);
		const createGlob = (value: string[], flag: string) =>
			`import.meta.glob(${JSON.stringify(value)}, { query: { ${flag}: true } })`;
		contentEntryGlobResult = createGlob(
			globWithUnderscoresIgnored(relContentDir, contentEntryExts),
			CONTENT_FLAG,
		);
		dataEntryGlobResult = createGlob(
			globWithUnderscoresIgnored(relContentDir, dataEntryExts),
			DATA_FLAG,
		);
		renderEntryGlobResult = createGlob(
			globWithUnderscoresIgnored(relContentDir, contentEntryExts),
			CONTENT_RENDER_FLAG,
		);
	} else {
		contentEntryGlobResult = getStringifiedCollectionFromLookup(
			'content',
			relContentDir,
			lookupMap,
		);
		dataEntryGlobResult = getStringifiedCollectionFromLookup('data', relContentDir, lookupMap);
		renderEntryGlobResult = getStringifiedCollectionFromLookup('render', relContentDir, lookupMap);
	}

	let virtualModContents =
		nodeFs
			.readFileSync(contentPaths.virtualModTemplate, 'utf-8')
			.replace('@@CONTENT_DIR@@', relContentDir)
			.replace("'@@CONTENT_ENTRY_GLOB_PATH@@'", contentEntryGlobResult)
			.replace("'@@DATA_ENTRY_GLOB_PATH@@'", dataEntryGlobResult)
			.replace("'@@RENDER_ENTRY_GLOB_PATH@@'", renderEntryGlobResult)
			.replace('/* @@LOOKUP_MAP_ASSIGNMENT@@ */', `lookupMap = ${JSON.stringify(lookupMap)};`) +
		(isClient
			? `
console.warn('astro:content is only supported running server-side. Using it in the browser will lead to bloated bundles and slow down page load. In the future it will not be supported.');`
			: '');

	return virtualModContents;
}

function getStringifiedCollectionFromLookup(
	wantedType: 'content' | 'data' | 'render',
	relContentDir: string,
	lookupMap: ContentLookupMap,
) {
	let str = '{';
	// In dev, we don't need to normalize the import specifier at all. Vite handles it.
	let normalize = (slug: string) => slug;
	// For prod builds, we need to transform from `/src/content/**/*.{md,mdx,json,yaml}` to a relative `./**/*.mjs` import
	if (process.env.NODE_ENV === 'production') {
		const suffix = wantedType === 'render' ? '.entry.mjs' : '.mjs';
		normalize = (slug: string) =>
			`${removeFileExtension(encodeName(slug)).replace(relContentDir, './')}${suffix}`;
	} else {
		let suffix = '';
		if (wantedType === 'content') suffix = CONTENT_FLAG;
		else if (wantedType === 'data') suffix = DATA_FLAG;
		else if (wantedType === 'render') suffix = CONTENT_RENDER_FLAG;
		normalize = (slug: string) => `${slug}?${suffix}`;
	}
	for (const { type, entries } of Object.values(lookupMap)) {
		if (type === wantedType || (wantedType === 'render' && type === 'content')) {
			for (const slug of Object.values(entries)) {
				str += `\n  "${slug}": () => import("${normalize(slug)}"),`;
			}
		}
	}
	str += '\n}';
	return str;
}

/**
 * Generate a map from a collection + slug to the local file path.
 * This is used internally to resolve entry imports when using `getEntry()`.
 * @see `templates/content/module.mjs`
 */
export async function generateLookupMap({
	settings,
	fs,
}: {
	settings: AstroSettings;
	fs: typeof nodeFs;
}) {
	const { root } = settings.config;
	const contentPaths = getContentPaths(settings.config);
	const relContentDir = rootRelativePath(root, contentPaths.contentDir, false);

	const contentEntryConfigByExt = getEntryConfigByExtMap(settings.contentEntryTypes);
	const dataEntryExts = getDataEntryExts(settings);

	const { contentDir } = contentPaths;

	const contentEntryExts = [...contentEntryConfigByExt.keys()];

	let lookupMap: ContentLookupMap = {};
	const contentGlob = await glob(
		`${relContentDir}**/*${getExtGlob([...dataEntryExts, ...contentEntryExts])}`,
		{
			absolute: true,
			cwd: fileURLToPath(root),
			fs,
		},
	);

	// Run 10 at a time to prevent `await getEntrySlug` from accessing the filesystem all at once.
	// Each await shouldn't take too long for the work to be noticeably slow too.
	const limit = pLimit(10);
	const promises: Promise<void>[] = [];

	for (const filePath of contentGlob) {
		promises.push(
			limit(async () => {
				const entryType = getEntryType(filePath, contentPaths, contentEntryExts, dataEntryExts);
				// Globbed ignored or unsupported entry.
				// Logs warning during type generation, should ignore in lookup map.
				if (entryType !== 'content' && entryType !== 'data') return;

				const collection = getEntryCollectionName({ contentDir, entry: pathToFileURL(filePath) });
				if (!collection) throw UnexpectedLookupMapError;

				if (lookupMap[collection]?.type && lookupMap[collection].type !== entryType) {
					throw new AstroError({
						...AstroErrorData.MixedContentDataCollectionError,
						message: AstroErrorData.MixedContentDataCollectionError.message(collection),
					});
				}

				if (entryType === 'content') {
					const contentEntryType = contentEntryConfigByExt.get(extname(filePath));
					if (!contentEntryType) throw UnexpectedLookupMapError;

					const { id, slug: generatedSlug } = await getContentEntryIdAndSlug({
						entry: pathToFileURL(filePath),
						contentDir,
						collection,
					});
					const slug = await getEntrySlug({
						id,
						collection,
						generatedSlug,
						fs,
						fileUrl: pathToFileURL(filePath),
						contentEntryType,
					});
					if (lookupMap[collection]?.entries?.[slug]) {
						throw new AstroError({
							...AstroErrorData.DuplicateContentEntrySlugError,
							message: AstroErrorData.DuplicateContentEntrySlugError.message(
								collection,
								slug,
								lookupMap[collection].entries[slug],
								rootRelativePath(root, filePath),
							),
							hint:
								slug !== generatedSlug
									? `Check the \`slug\` frontmatter property in **${id}**.`
									: undefined,
						});
					}
					lookupMap[collection] = {
						type: 'content',
						entries: {
							...lookupMap[collection]?.entries,
							[slug]: rootRelativePath(root, filePath),
						},
					};
				} else {
					const id = getDataEntryId({ entry: pathToFileURL(filePath), contentDir, collection });
					lookupMap[collection] = {
						type: 'data',
						entries: {
							...lookupMap[collection]?.entries,
							[id]: rootRelativePath(root, filePath),
						},
					};
				}
			}),
		);
	}

	await Promise.all(promises);
	return lookupMap;
}

function globWithUnderscoresIgnored(relContentDir: string, exts: string[]): string[] {
	const extGlob = getExtGlob(exts);
	const contentDir = appendForwardSlash(relContentDir);
	return [
		`${contentDir}**/*${extGlob}`,
		`!${contentDir}**/_*/**/*${extGlob}`,
		`!${contentDir}**/_*${extGlob}`,
	];
}

const UnexpectedLookupMapError = new AstroError({
	...AstroErrorData.UnknownContentCollectionError,
	message: `Unexpected error while parsing content entry IDs and slugs.`,
});
