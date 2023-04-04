import * as devalue from 'devalue';
import type fsMod from 'node:fs';
import { extname } from 'node:path';
import type { PluginContext } from 'rollup';
import { pathToFileURL } from 'url';
import type { Plugin } from 'vite';
import type { AstroSettings, ContentEntryModule, ContentEntryType } from '../@types/astro.js';
import { AstroErrorData } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/errors.js';
import { escapeViteEnvReferences, getFileInfo } from '../vite-plugin-utils/index.js';
import { CONTENT_FLAG } from './consts.js';
import {
	getContentEntryExts,
	getContentPaths,
	getEntryData,
	getEntryInfo,
	getEntrySlug,
	getEntryType,
	globalContentConfigObserver,
	NoCollectionError,
	type ContentConfig,
} from './utils.js';

function isContentFlagImport(viteId: string) {
	const flags = new URLSearchParams(viteId.split('?')[1]);
	return flags.has(CONTENT_FLAG);
}

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

export function astroContentImportPlugin({
	fs,
	settings,
}: {
	fs: typeof fsMod;
	settings: AstroSettings;
}): Plugin[] {
	const contentPaths = getContentPaths(settings.config, fs);
	const contentEntryExts = getContentEntryExts(settings);

	const contentEntryExtToParser: Map<string, ContentEntryType> = new Map();
	for (const entryType of settings.contentEntryTypes) {
		for (const ext of entryType.extensions) {
			contentEntryExtToParser.set(ext, entryType);
		}
	}

	const plugins: Plugin[] = [
		{
			name: 'astro:content-imports',
			async transform(code, viteId) {
				if (isContentFlagImport(viteId)) {
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
	filePath: ${JSON.stringify(_internal.filePath)},
	rawData: ${JSON.stringify(_internal.rawData)},
};
`);
					return { code };
				}
			},
			configureServer(viteServer) {
				viteServer.watcher.on('all', async (event, entry) => {
					if (
						CHOKIDAR_MODIFIED_EVENTS.includes(event) &&
						getEntryType(entry, contentPaths, contentEntryExts) === 'config'
					) {
						// Content modules depend on config, so we need to invalidate them.
						for (const modUrl of viteServer.moduleGraph.urlToModuleMap.keys()) {
							if (
								isContentFlagImport(modUrl) ||
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
			async load(viteId) {
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
		if (!contentEntryExtToParser.has(fileExt)) {
			throw new AstroError({
				...AstroErrorData.UnknownContentCollectionError,
				message: `No parser found for content entry ${JSON.stringify(
					fileId
				)}. Did you apply an integration for this file type?`,
			});
		}
		const contentEntryParser = contentEntryExtToParser.get(fileExt)!;
		const {
			rawData,
			body,
			slug: unvalidatedSlug,
			data: unvalidatedData,
		} = await contentEntryParser.getEntryInfo({
			fileUrl: pathToFileURL(fileId),
			contents: rawContents,
		});
		const entryInfoResult = getEntryInfo({
			entry: pathToFileURL(fileId),
			contentDir: contentPaths.contentDir,
		});
		if (entryInfoResult instanceof NoCollectionError) throw entryInfoResult;

		const { id, slug: generatedSlug, collection } = entryInfoResult;

		const _internal = { filePath: fileId, rawData: rawData };
		// TODO: move slug calculation to the start of the build
		// to generate a performant lookup map for `getEntryBySlug`
		const slug = getEntrySlug({ id, collection, slug: generatedSlug, unvalidatedSlug });

		const collectionConfig = contentConfig?.collections[collection];
		let data = collectionConfig
			? await getEntryData(
					{ id, collection, slug, _internal, unvalidatedData },
					collectionConfig,
					pluginContext,
					settings
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
