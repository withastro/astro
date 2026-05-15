import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as devalue from 'devalue';
import { getProxyCode } from '../assets/utils/proxy.js';
import { AstroError } from '../core/errors/errors.js';
import { AstroErrorData } from '../core/errors/index.js';
import { CONTENT_FLAG, DATA_FLAG } from './consts.js';
import {
	getContentEntryExts,
	getContentEntryIdAndSlug,
	getContentPaths,
	getDataEntryExts,
	getDataEntryId,
	getEntryCollectionName,
	getEntryConfigByExtMap,
	getEntryData,
	getEntryType,
	getSymlinkedContentCollections,
	globalContentConfigObserver,
	hasContentFlag,
	parseEntrySlug,
	reloadContentConfigObserver,
	reverseSymlink,
} from './utils.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
function getContentRendererByViteId(viteId, settings) {
	let ext = viteId.split('.').pop();
	if (!ext) return void 0;
	for (const contentEntryType of settings.contentEntryTypes) {
		if (
			Boolean(contentEntryType.getRenderModule) &&
			contentEntryType.extensions.includes('.' + ext)
		) {
			return contentEntryType.getRenderModule;
		}
	}
	return void 0;
}
const CHOKIDAR_MODIFIED_EVENTS = ['add', 'unlink', 'change'];
const COLLECTION_TYPES_TO_INVALIDATE_ON = ['data', 'content', 'config'];
function astroContentImportPlugin({ fs, settings, logger }) {
	const contentPaths = getContentPaths(
		settings.config,
		fs,
		settings.config.legacy?.collectionsBackwardsCompat,
	);
	const contentEntryExts = getContentEntryExts(settings);
	const dataEntryExts = getDataEntryExts(settings);
	const contentEntryConfigByExt = getEntryConfigByExtMap(settings.contentEntryTypes);
	const dataEntryConfigByExt = getEntryConfigByExtMap(settings.dataEntryTypes);
	const { contentDir } = contentPaths;
	let shouldEmitFile = false;
	let symlinks;
	const plugins = [
		{
			name: 'astro:content-imports',
			config(_config, env) {
				shouldEmitFile = env.command === 'build';
			},
			async buildStart() {
				symlinks = await getSymlinkedContentCollections({ contentDir, logger, fs });
			},
			transform: {
				filter: {
					id: new RegExp(`(?:\\?|&)(?:${DATA_FLAG}|${CONTENT_FLAG})(?:&|=|$)`),
				},
				async handler(_, viteId) {
					if (hasContentFlag(viteId, DATA_FLAG)) {
						const fileId = reverseSymlink({
							entry: viteId.split('?')[0] ?? viteId,
							contentDir,
							symlinks,
						});
						const { id, data, collection, _internal } = await getDataEntryModule({
							fileId,
							entryConfigByExt: dataEntryConfigByExt,
							contentDir,
							config: settings.config,
							fs,
							pluginContext: this,
							shouldEmitFile,
						});
						const code = `
export const id = ${JSON.stringify(id)};
export const collection = ${JSON.stringify(collection)};
export const data = ${stringifyEntryData(data, settings.buildOutput === 'server')};
export const _internal = {
	type: 'data',
	filePath: ${JSON.stringify(_internal.filePath)},
	rawData: ${JSON.stringify(_internal.rawData)},
};
`;
						return code;
					} else if (hasContentFlag(viteId, CONTENT_FLAG)) {
						const fileId = reverseSymlink({ entry: viteId.split('?')[0], contentDir, symlinks });
						const { id, slug, collection, body, data, _internal } = await getContentEntryModule({
							fileId,
							entryConfigByExt: contentEntryConfigByExt,
							contentDir,
							config: settings.config,
							fs,
							pluginContext: this,
							shouldEmitFile,
						});
						const code = `
						export const id = ${JSON.stringify(id)};
						export const collection = ${JSON.stringify(collection)};
						export const slug = ${JSON.stringify(slug)};
						export const body = ${JSON.stringify(body)};
						export const data = ${stringifyEntryData(data, settings.buildOutput === 'server')};
						export const _internal = {
							type: 'content',
							filePath: ${JSON.stringify(_internal.filePath)},
							rawData: ${JSON.stringify(_internal.rawData)},
						};`;
						return { code, map: { mappings: '' } };
					}
				},
			},
			configureServer(viteServer) {
				viteServer.watcher.on('all', async (event, entry) => {
					if (CHOKIDAR_MODIFIED_EVENTS.includes(event)) {
						const environment = viteServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr];
						const timestamp = Date.now();
						const entryType = getEntryType(entry, contentPaths, contentEntryExts, dataEntryExts);
						if (!COLLECTION_TYPES_TO_INVALIDATE_ON.includes(entryType)) return;
						if (entryType === 'content' || entryType === 'data') {
							await reloadContentConfigObserver({
								fs,
								settings,
								environment: viteServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.astro],
							});
						}
						for (const modUrl of environment.moduleGraph.urlToModuleMap.keys()) {
							if (
								hasContentFlag(modUrl, CONTENT_FLAG) ||
								hasContentFlag(modUrl, DATA_FLAG) ||
								Boolean(getContentRendererByViteId(modUrl, settings))
							) {
								try {
									const mod = await environment.moduleGraph.getModuleByUrl(modUrl);
									if (mod) {
										environment.moduleGraph.invalidateModule(mod, void 0, timestamp, true);
									}
								} catch (e) {
									if (e.code === 'ERR_CLOSED_SERVER') break;
									throw e;
								}
							}
						}
					}
				});
			},
		},
	];
	if (settings.contentEntryTypes.some((t) => t.getRenderModule)) {
		plugins.push({
			name: 'astro:content-render-imports',
			transform: {
				filter: {
					id: {
						include: settings.contentEntryTypes
							.filter((t) => t.getRenderModule)
							.map((t) => new RegExp(`\\.(${t.extensions.map((e) => e.slice(1)).join('|')})$`)),
					},
				},
				async handler(contents, viteId) {
					const contentRenderer = getContentRendererByViteId(viteId, settings);
					if (!contentRenderer) return;
					const fileId = viteId.split('?')[0];
					return contentRenderer.bind(this)({ viteId, contents, fileUrl: pathToFileURL(fileId) });
				},
			},
		});
	}
	return plugins;
}
async function getContentEntryModule(params) {
	const { fileId, contentDir, pluginContext } = params;
	const { collectionConfig, entryConfig, entry, rawContents, collection } =
		await getEntryModuleBaseInfo(params);
	const {
		rawData,
		data: unvalidatedData,
		body,
		slug: frontmatterSlug,
	} = await entryConfig.getEntryInfo({
		fileUrl: pathToFileURL(fileId),
		contents: rawContents,
	});
	const _internal = { filePath: fileId, rawData };
	const { id, slug: generatedSlug } = getContentEntryIdAndSlug({ entry, contentDir, collection });
	const slug = parseEntrySlug({
		id,
		collection,
		generatedSlug,
		frontmatterSlug,
	});
	const data = collectionConfig
		? await getEntryData(
				{ id, collection, _internal, unvalidatedData },
				collectionConfig,
				params.shouldEmitFile,
				pluginContext,
			)
		: unvalidatedData;
	const contentEntryModule = {
		id,
		slug,
		collection,
		data,
		body,
		_internal,
	};
	return contentEntryModule;
}
async function getDataEntryModule(params) {
	const { fileId, contentDir, pluginContext } = params;
	const { collectionConfig, entryConfig, entry, rawContents, collection } =
		await getEntryModuleBaseInfo(params);
	const { rawData = '', data: unvalidatedData } = await entryConfig.getEntryInfo({
		fileUrl: pathToFileURL(fileId),
		contents: rawContents,
	});
	const _internal = { filePath: fileId, rawData };
	const id = getDataEntryId({ entry, contentDir, collection });
	const data = collectionConfig
		? await getEntryData(
				{ id, collection, _internal, unvalidatedData },
				collectionConfig,
				params.shouldEmitFile,
				pluginContext,
			)
		: unvalidatedData;
	const dataEntryModule = {
		id,
		collection,
		data,
		_internal,
	};
	return dataEntryModule;
}
async function getEntryModuleBaseInfo({ fileId, entryConfigByExt, contentDir, fs }) {
	const contentConfig = await getContentConfigFromGlobal();
	let rawContents;
	try {
		rawContents = await fs.promises.readFile(fileId, 'utf-8');
	} catch (e) {
		throw new AstroError({
			...AstroErrorData.UnknownContentCollectionError,
			message: `Unexpected error reading entry ${JSON.stringify(fileId)}.`,
			stack: e instanceof Error ? e.stack : void 0,
		});
	}
	const fileExt = extname(fileId);
	const entryConfig = entryConfigByExt.get(fileExt);
	if (!entryConfig) {
		throw new AstroError({
			...AstroErrorData.UnknownContentCollectionError,
			message: `No parser found for data entry ${JSON.stringify(
				fileId,
			)}. Did you apply an integration for this file type?`,
		});
	}
	const entry = pathToFileURL(fileId);
	const collection = getEntryCollectionName({ entry, contentDir });
	if (collection === void 0) throw new AstroError(AstroErrorData.UnknownContentCollectionError);
	const collectionConfig = contentConfig?.collections[collection];
	return {
		collectionConfig,
		entry,
		entryConfig,
		collection,
		rawContents,
	};
}
async function getContentConfigFromGlobal() {
	const observable = globalContentConfigObserver.get();
	if (observable.status === 'init') {
		throw new AstroError({
			...AstroErrorData.UnknownContentCollectionError,
			message: 'Content config failed to load.',
		});
	}
	if (observable.status === 'error') {
		throw observable.error;
	}
	let contentConfig = observable.status === 'loaded' ? observable.config : void 0;
	if (observable.status === 'loading') {
		contentConfig = await new Promise((resolve) => {
			const unsubscribe = globalContentConfigObserver.subscribe((ctx) => {
				if (ctx.status === 'loaded') {
					resolve(ctx.config);
					unsubscribe();
				}
				if (ctx.status === 'error') {
					resolve(void 0);
					unsubscribe();
				}
			});
		});
	}
	return contentConfig;
}
function stringifyEntryData(data, isSSR) {
	try {
		return devalue.uneval(data, (value) => {
			if (value instanceof URL) {
				return `new URL(${JSON.stringify(value.href)})`;
			}
			if (typeof value === 'object' && 'ASTRO_ASSET' in value) {
				const { ASTRO_ASSET, ...asset } = value;
				asset.fsPath = ASTRO_ASSET;
				return getProxyCode(asset, isSSR);
			}
		});
	} catch (e) {
		if (e instanceof Error) {
			throw new AstroError({
				...AstroErrorData.UnsupportedConfigTransformError,
				message: AstroErrorData.UnsupportedConfigTransformError.message(e.message),
				stack: e.stack,
			});
		} else {
			throw new AstroError({
				name: 'PluginContentImportsError',
				message: 'Unexpected error processing content collection data.',
			});
		}
	}
}
export { astroContentImportPlugin };
