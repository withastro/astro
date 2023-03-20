import * as devalue from 'devalue';
import type fsMod from 'node:fs';
import type { ContentEntryModule } from '../@types/astro.js';
import { extname } from 'node:path';
import type { PluginContext } from 'rollup';
import { pathToFileURL } from 'url';
import type { Plugin } from 'vite';
import type { AstroSettings, ContentEntryType } from '../@types/astro.js';
import { AstroErrorData } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/errors.js';
import { escapeViteEnvReferences, getFileInfo } from '../vite-plugin-utils/index.js';
import { CONTENT_FLAG } from './consts.js';
import {
	ContentObservable,
	getContentEntryExts,
	getContentPaths,
	getEntryData,
	getEntryInfo,
	getEntrySlug,
	getEntryType,
	globalContentConfigObserver,
	NoCollectionError,
	patchAssets,
	type ContentConfig,
} from './utils.js';
function isContentFlagImport(viteId: string, contentEntryExts: string[]) {
	const { searchParams, pathname } = new URL(viteId, 'file://');
	return searchParams.has(CONTENT_FLAG) && contentEntryExts.some((ext) => pathname.endsWith(ext));
}

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
			async load(viteId) {
				if (isContentFlagImport(viteId, contentEntryExts)) {
					const { fileId } = getFileInfo(viteId, settings.config);
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
						['add', 'unlink', 'change'].includes(event) &&
						getEntryType(entry, contentPaths, contentEntryExts) === 'config'
					) {
						// Content modules depend on config, so we need to invalidate them.
						for (const modUrl of viteServer.moduleGraph.urlToModuleMap.keys()) {
							if (
								isContentFlagImport(modUrl, contentEntryExts) ||
								// TODO: refine to content types with getModule
								contentEntryExts.some((ext) => modUrl.endsWith(ext))
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
			async transform(code, id) {
				if (isContentFlagImport(id, contentEntryExts)) {
					// Escape before Rollup internal transform.
					// Base on MUCH trial-and-error, inspired by MDX integration 2-step transform.
					return { code: escapeViteEnvReferences(code) };
				}
			},
		},
	];

	if (settings.contentEntryTypes.some((t) => t.getRenderModule)) {
		plugins.push({
			name: 'astro:content-render-imports',
			async load(viteId) {
				if (!contentEntryExts.some((ext) => viteId.endsWith(ext))) return;

				const { fileId } = getFileInfo(viteId, settings.config);
				for (const contentEntryType of settings.contentEntryTypes) {
					if (contentEntryType.getRenderModule) {
						const entry = await getContentEntryModuleFromCache(fileId);
						// Cached entry must exist (or be in-flight) when importing the module via content collections.
						// This is ensured by the `astro:content-imports` plugin.
						if (!entry)
							throw new AstroError({
								...AstroErrorData.UnknownContentCollectionError,
								message: `Unable to render ${JSON.stringify(
									fileId
								)}. Did you import this module directly without using a content collection query?`,
							});

						return contentEntryType.getRenderModule({ entry });
					}
				}
			},
		});
	}

	// Used by the `render-module` plugin to avoid double-parsing your schema
	const contentEntryModuleByIdCache = new Map<string, ContentEntryModule | 'loading'>();
	const awaitingCacheById = new Map<string, ((val: ContentEntryModule) => void)[]>();
	function getContentEntryModuleFromCache(id: string) {
		const value = contentEntryModuleByIdCache.get(id);
		// It's possible for Vite to load modules that depend on this cache
		// before the cache is populated. In that case, we queue a promise
		// to be resolved by `setContentEntryModuleCache`.
		if (value === 'loading') {
			return new Promise<ContentEntryModule>((resolve, reject) => {
				const awaiting = awaitingCacheById.get(id) ?? [];
				awaiting.push(resolve);
				awaitingCacheById.set(id, awaiting);
			});
		} else if (value) {
			return Promise.resolve(value);
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
		contentEntryModuleByIdCache.set(fileId, 'loading');

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
		const info = await contentEntryParser.getEntryInfo({
			fileUrl: pathToFileURL(fileId),
			contents: rawContents,
		});
		const generatedInfo = getEntryInfo({
			entry: pathToFileURL(fileId),
			contentDir: contentPaths.contentDir,
		});
		if (generatedInfo instanceof NoCollectionError) throw generatedInfo;

		const _internal = { filePath: fileId, rawData: info.rawData };
		// TODO: move slug calculation to the start of the build
		// to generate a performant lookup map for `getEntryBySlug`
		const slug = getEntrySlug({ ...generatedInfo, unvalidatedSlug: info.slug });

		const collectionConfig = contentConfig?.collections[generatedInfo.collection];
		let data = collectionConfig
			? await getEntryData(
					{ ...generatedInfo, _internal, unvalidatedData: info.data },
					collectionConfig
			  )
			: info.data;

		await patchAssets(data, pluginContext.meta.watchMode, pluginContext.emitFile, settings);
		const contentEntryModule: ContentEntryModule = {
			...generatedInfo,
			_internal,
			slug,
			data,
			body: info.body,
		};
		contentEntryModuleByIdCache.set(fileId, contentEntryModule);
		const awaiting = awaitingCacheById.get(fileId);
		if (awaiting) {
			for (const resolve of awaiting) {
				resolve(contentEntryModule);
			}
			awaitingCacheById.delete(fileId);
		}
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
				} else if (ctx.status === 'error') {
					resolve(undefined);
					unsubscribe();
				}
			});
		});
	}

	return contentConfig;
}
