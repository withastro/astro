import * as devalue from 'devalue';
import type fsMod from 'node:fs';
import { extname } from 'node:path';
import type { PluginContext } from 'rollup';
import { pathToFileURL } from 'url';
import type { Plugin } from 'vite';
import type {
	AstroSettings,
	ContentEntryModule,
	ContentEntryType,
	DataEntryModule,
	DataEntryType,
} from '../@types/astro.js';
import { AstroErrorData } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/errors.js';
import { escapeViteEnvReferences, getFileInfo } from '../vite-plugin-utils/index.js';
import { CONTENT_FLAG, DATA_FLAG } from './consts.js';
import {
	getContentEntryConfigByExtMap,
	getContentEntryExts,
	getContentEntryIdAndSlug,
	getContentPaths,
	getDataEntryExts,
	getDataEntryId,
	getEntryCollectionName,
	getEntryData,
	getEntryType,
	globalContentConfigObserver,
	hasContentFlag,
	parseEntrySlug,
	reloadContentConfigObserver,
	type ContentConfig,
	type ContentPaths,
} from './utils.js';

function getContentRendererByViteId(
	viteId: string,
	settings: Pick<AstroSettings, 'contentEntryTypes'>
): ContentEntryType['getRenderModule'] | undefined {
	let ext = viteId.split('.').pop();
	if (!ext) return undefined;
	for (const contentEntryType of settings.contentEntryTypes) {
		if (
			Boolean(contentEntryType.getRenderModule) &&
			contentEntryType.extensions.includes('.' + ext)
		) {
			return contentEntryType.getRenderModule;
		}
	}
	return undefined;
}

const CHOKIDAR_MODIFIED_EVENTS = ['add', 'unlink', 'change'];
/**
 * If collection entries change, import modules need to be invalidated.
 * Reasons why:
 * - 'config' - content imports depend on the config file for parsing schemas
 * - 'data' | 'content' - the config may depend on collection entries via `reference()`
 */
const COLLECTION_TYPES_TO_INVALIDATE_ON = ['data', 'content', 'config'];

export function astroContentImportPlugin({
	fs,
	settings,
}: {
	fs: typeof fsMod;
	settings: AstroSettings;
}): Plugin[] {
	const contentPaths = getContentPaths(settings.config, fs);
	const contentEntryExts = getContentEntryExts(settings);
	const dataEntryExts = getDataEntryExts(settings);

	const contentEntryConfigByExt = getContentEntryConfigByExtMap(settings);

	const dataEntryExtToParser: Map<string, DataEntryType['getEntryInfo']> = new Map();
	for (const entryType of settings.dataEntryTypes) {
		for (const ext of entryType.extensions) {
			dataEntryExtToParser.set(ext, entryType.getEntryInfo);
		}
	}

	const plugins: Plugin[] = [
		{
			name: 'astro:content-imports',
			async transform(_, viteId) {
				if (hasContentFlag(viteId, DATA_FLAG)) {
					const fileId = viteId.split('?')[0] ?? viteId;
					// Data collections don't need to rely on the module cache.
					// This cache only exists for the `render()` function specific to content.
					const { id, data, collection, _internal } = await getDataEntryModule({
						fileId,
						dataEntryExtToParser,
						contentPaths,
						settings,
						fs,
						pluginContext: this,
					});

					const code = escapeViteEnvReferences(`
export const id = ${JSON.stringify(id)};
export const collection = ${JSON.stringify(collection)};
export const data = ${devalue.uneval(data) /* TODO: reuse astro props serializer */};
export const _internal = {
	type: 'data',
	filePath: ${JSON.stringify(_internal.filePath)},
	rawData: ${JSON.stringify(_internal.rawData)},
};
`);
					return code;
				} else if (hasContentFlag(viteId, CONTENT_FLAG)) {
					const fileId = viteId.split('?')[0];
					const { id, slug, collection, body, data, _internal } = await setContentEntryModuleCache({
						fileId,
						pluginContext: this,
					});

					const code = escapeViteEnvReferences(`
						export const id = ${JSON.stringify(id)};
						export const collection = ${JSON.stringify(collection)};
						export const slug = ${JSON.stringify(slug)};
						export const body = ${JSON.stringify(body)};
						export const data = ${devalue.uneval(data) /* TODO: reuse astro props serializer */};
						export const _internal = {
							type: 'content',
							filePath: ${JSON.stringify(_internal.filePath)},
							rawData: ${JSON.stringify(_internal.rawData)},
						};`);

					return { code, map: { mappings: '' } };
				}
			},
			configureServer(viteServer) {
				viteServer.watcher.on('all', async (event, entry) => {
					if (CHOKIDAR_MODIFIED_EVENTS.includes(event)) {
						const entryType = getEntryType(
							entry,
							contentPaths,
							contentEntryExts,
							dataEntryExts,
							settings.config.experimental.assets
						);
						if (!COLLECTION_TYPES_TO_INVALIDATE_ON.includes(entryType)) return;

						// The content config could depend on collection entries via `reference()`.
						// Reload the config in case of changes.
						if (entryType === 'content' || entryType === 'data') {
							await reloadContentConfigObserver({ fs, settings, viteServer });
						}

						// Invalidate all content imports and `render()` modules.
						// TODO: trace `reference()` calls for fine-grained invalidation.
						for (const modUrl of viteServer.moduleGraph.urlToModuleMap.keys()) {
							if (
								hasContentFlag(modUrl, CONTENT_FLAG) ||
								hasContentFlag(modUrl, DATA_FLAG) ||
								Boolean(getContentRendererByViteId(modUrl, settings))
							) {
								const mod = await viteServer.moduleGraph.getModuleByUrl(modUrl);
								if (mod) {
									viteServer.moduleGraph.invalidateModule(mod);
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
			async transform(_, viteId) {
				const contentRenderer = getContentRendererByViteId(viteId, settings);
				if (!contentRenderer) return;

				const { fileId } = getFileInfo(viteId, settings.config);
				const entry = await getContentEntryModuleFromCache(fileId);
				if (!entry) {
					// Cached entry must exist (or be in-flight) when importing the module via content collections.
					// This is ensured by the `astro:content-imports` plugin.
					throw new AstroError({
						...AstroErrorData.UnknownContentCollectionError,
						message: `Unable to render ${JSON.stringify(
							fileId
						)}. Did you import this module directly without using a content collection query?`,
					});
				}

				return contentRenderer.bind(this)({ entry, viteId });
			},
		});
	}

	/**
	 * There are two content collection plugins that depend on the same entry data:
	 * - `astro:content-imports` - creates module containing the `getCollection()` result.
	 * - `astro:content-render-imports` - creates module containing the `collectionEntry.render()` result.
	 *
	 * We could run the same transforms to generate the slug and parsed data in each plugin,
	 * though this would run the user's collection schema _twice_ for each entry.
	 *
	 * Instead, we've implemented a cache for all content entry data. To avoid race conditions,
	 * this may store either the module itself or a queue of promises awaiting this module.
	 * See the implementations of `getContentEntryModuleFromCache` and `setContentEntryModuleCache`.
	 */
	const contentEntryModuleByIdCache = new Map<
		string,
		ContentEntryModule | AwaitingCacheResultQueue
	>();
	type AwaitingCacheResultQueue = {
		awaitingQueue: ((val: ContentEntryModule) => void)[];
	};
	function isAwaitingQueue(
		cacheEntry: ReturnType<typeof contentEntryModuleByIdCache.get>
	): cacheEntry is AwaitingCacheResultQueue {
		return typeof cacheEntry === 'object' && cacheEntry != null && 'awaitingQueue' in cacheEntry;
	}

	function getContentEntryModuleFromCache(id: string): Promise<ContentEntryModule | undefined> {
		const cacheEntry = contentEntryModuleByIdCache.get(id);
		// It's possible to request an entry while `setContentEntryModuleCache` is still
		// setting that entry. In this case, queue a promise for `setContentEntryModuleCache`
		// to resolve once it is complete.
		if (isAwaitingQueue(cacheEntry)) {
			return new Promise<ContentEntryModule>((resolve, reject) => {
				cacheEntry.awaitingQueue.push(resolve);
			});
		} else if (cacheEntry) {
			return Promise.resolve(cacheEntry);
		}
		return Promise.resolve(undefined);
	}

	async function setContentEntryModuleCache({
		fileId,
		pluginContext,
	}: {
		fileId: string;
		pluginContext: PluginContext;
	}): Promise<ContentEntryModule> {
		// Create a queue so, if `getContentEntryModuleFromCache` is called
		// while this function is running, we can resolve all requests
		// in the `awaitingQueue` with the result.
		contentEntryModuleByIdCache.set(fileId, { awaitingQueue: [] });

		const contentConfig = await getContentConfigFromGlobal();
		const rawContents = await fs.promises.readFile(fileId, 'utf-8');
		const fileExt = extname(fileId);
		if (!contentEntryConfigByExt.has(fileExt)) {
			throw new AstroError({
				...AstroErrorData.UnknownContentCollectionError,
				message: `No parser found for content entry ${JSON.stringify(
					fileId
				)}. Did you apply an integration for this file type?`,
			});
		}
		const contentEntryConfig = contentEntryConfigByExt.get(fileExt)!;
		const {
			rawData,
			body,
			slug: frontmatterSlug,
			data: unvalidatedData,
		} = await contentEntryConfig.getEntryInfo({
			fileUrl: pathToFileURL(fileId),
			contents: rawContents,
		});
		const entry = pathToFileURL(fileId);
		const { contentDir } = contentPaths;
		const collection = getEntryCollectionName({ entry, contentDir });
		if (collection === undefined)
			throw new AstroError(AstroErrorData.UnknownContentCollectionError);

		const { id, slug: generatedSlug } = getContentEntryIdAndSlug({ entry, contentDir, collection });

		const _internal = { filePath: fileId, rawData: rawData };
		// TODO: move slug calculation to the start of the build
		// to generate a performant lookup map for `getEntryBySlug`
		const slug = parseEntrySlug({
			id,
			collection,
			generatedSlug,
			frontmatterSlug,
		});

		const collectionConfig = contentConfig?.collections[collection];
		let data = collectionConfig
			? await getEntryData(
					{ id, collection, _internal, unvalidatedData },
					collectionConfig,
					pluginContext,
					settings.config
			  )
			: unvalidatedData;

		const contentEntryModule: ContentEntryModule = {
			id,
			slug,
			collection,
			data,
			body,
			_internal,
		};

		const cacheEntry = contentEntryModuleByIdCache.get(fileId);
		// Pass the entry to all promises awaiting this result
		if (isAwaitingQueue(cacheEntry)) {
			for (const resolve of cacheEntry.awaitingQueue) {
				resolve(contentEntryModule);
			}
		}
		contentEntryModuleByIdCache.set(fileId, contentEntryModule);
		return contentEntryModule;
	}

	return plugins;
}

async function getContentConfigFromGlobal() {
	const observable = globalContentConfigObserver.get();

	// Content config should be loaded before being accessed from Vite plugins
	if (observable.status === 'init') {
		throw new AstroError({
			...AstroErrorData.UnknownContentCollectionError,
			message: 'Content config failed to load.',
		});
	}
	if (observable.status === 'error') {
		// Throw here to bubble content config errors
		// to the error overlay in development
		throw observable.error;
	}

	let contentConfig: ContentConfig | undefined =
		observable.status === 'loaded' ? observable.config : undefined;
	if (observable.status === 'loading') {
		// Wait for config to load
		contentConfig = await new Promise((resolve) => {
			const unsubscribe = globalContentConfigObserver.subscribe((ctx) => {
				if (ctx.status === 'loaded') {
					resolve(ctx.config);
					unsubscribe();
				}
				if (ctx.status === 'error') {
					resolve(undefined);
					unsubscribe();
				}
			});
		});
	}

	return contentConfig;
}

type GetDataEntryModuleParams = {
	fs: typeof fsMod;
	fileId: string;
	contentPaths: Pick<ContentPaths, 'contentDir'>;
	pluginContext: PluginContext;
	dataEntryExtToParser: Map<string, DataEntryType['getEntryInfo']>;
	settings: Pick<AstroSettings, 'config'>;
};

async function getDataEntryModule({
	fileId,
	dataEntryExtToParser,
	contentPaths,
	fs,
	pluginContext,
	settings,
}: GetDataEntryModuleParams): Promise<DataEntryModule> {
	const contentConfig = await getContentConfigFromGlobal();
	let rawContents;
	try {
		rawContents = await fs.promises.readFile(fileId, 'utf-8');
	} catch (e) {
		throw new AstroError({
			...AstroErrorData.UnknownContentCollectionError,
			message: `Unexpected error reading entry ${JSON.stringify(fileId)}.`,
			stack: e instanceof Error ? e.stack : undefined,
		});
	}
	const fileExt = extname(fileId);
	const dataEntryParser = dataEntryExtToParser.get(fileExt);

	if (!dataEntryParser) {
		throw new AstroError({
			...AstroErrorData.UnknownContentCollectionError,
			message: `No parser found for data entry ${JSON.stringify(
				fileId
			)}. Did you apply an integration for this file type?`,
		});
	}
	const { data: unvalidatedData, rawData = '' } = await dataEntryParser({
		fileUrl: pathToFileURL(fileId),
		contents: rawContents,
	});
	const entry = pathToFileURL(fileId);
	const { contentDir } = contentPaths;
	const collection = getEntryCollectionName({ entry, contentDir });
	if (collection === undefined) throw new AstroError(AstroErrorData.UnknownContentCollectionError);

	const id = getDataEntryId({ entry, contentDir, collection });

	const _internal = { filePath: fileId, rawData };

	const collectionConfig = contentConfig?.collections[collection];
	const data = collectionConfig
		? await getEntryData(
				{ id, collection, _internal, unvalidatedData },
				collectionConfig,
				pluginContext,
				settings.config
		  )
		: unvalidatedData;

	return { id, collection, data, _internal };
}
