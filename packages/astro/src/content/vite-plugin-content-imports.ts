import * as devalue from 'devalue';
import type fsMod from 'node:fs';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { PluginContext } from 'rollup';
import type { Plugin } from 'vite';
import type {
	AstroConfig,
	AstroSettings,
	ContentEntryModule,
	ContentEntryType,
	DataEntryModule,
	DataEntryType,
} from '../@types/astro.js';
import { AstroErrorData } from '../core/errors/index.js';
import { AstroError } from '../core/errors/errors.js';
import { escapeViteEnvReferences } from '../vite-plugin-utils/index.js';
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
	globalContentConfigObserver,
	hasContentFlag,
	parseEntrySlug,
	reloadContentConfigObserver,
	type ContentConfig,
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

	const contentEntryConfigByExt = getEntryConfigByExtMap(settings.contentEntryTypes);
	const dataEntryConfigByExt = getEntryConfigByExtMap(settings.dataEntryTypes);
	const { contentDir } = contentPaths;

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
						entryConfigByExt: dataEntryConfigByExt,
						contentDir,
						config: settings.config,
						fs,
						pluginContext: this,
					});

					const code = escapeViteEnvReferences(`
export const id = ${JSON.stringify(id)};
export const collection = ${JSON.stringify(collection)};
export const data = ${stringifyEntryData(data)};
export const _internal = {
	type: 'data',
	filePath: ${JSON.stringify(_internal.filePath)},
	rawData: ${JSON.stringify(_internal.rawData)},
};
`);
					return code;
				} else if (hasContentFlag(viteId, CONTENT_FLAG)) {
					const fileId = viteId.split('?')[0];
					const { id, slug, collection, body, data, _internal } = await getContentEntryModule({
						fileId,
						entryConfigByExt: contentEntryConfigByExt,
						contentDir,
						config: settings.config,
						fs,
						pluginContext: this,
					});

					const code = escapeViteEnvReferences(`
						export const id = ${JSON.stringify(id)};
						export const collection = ${JSON.stringify(collection)};
						export const slug = ${JSON.stringify(slug)};
						export const body = ${JSON.stringify(body)};
						export const data = ${stringifyEntryData(data)};
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
			async transform(contents, viteId) {
				const contentRenderer = getContentRendererByViteId(viteId, settings);
				if (!contentRenderer) return;

				const fileId = viteId.split('?')[0];
				return contentRenderer.bind(this)({ viteId, contents, fileUrl: pathToFileURL(fileId) });
			},
		});
	}

	return plugins;
}

type GetEntryModuleParams<TEntryType extends ContentEntryType | DataEntryType> = {
	fs: typeof fsMod;
	fileId: string;
	contentDir: URL;
	pluginContext: PluginContext;
	entryConfigByExt: Map<string, TEntryType>;
	config: AstroConfig;
};

async function getContentEntryModule(
	params: GetEntryModuleParams<ContentEntryType>
): Promise<ContentEntryModule> {
	const { fileId, contentDir, pluginContext, config } = params;
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
				pluginContext,
				config
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

	return contentEntryModule;
}

async function getDataEntryModule(
	params: GetEntryModuleParams<DataEntryType>
): Promise<DataEntryModule> {
	const { fileId, contentDir, pluginContext, config } = params;
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
				pluginContext,
				config
		  )
		: unvalidatedData;

	const dataEntryModule: DataEntryModule = {
		id,
		collection,
		data,
		_internal,
	};

	return dataEntryModule;
}

// Shared logic for `getContentEntryModule` and `getDataEntryModule`
// Extracting to a helper was easier that conditionals and generics :)
async function getEntryModuleBaseInfo<TEntryType extends ContentEntryType | DataEntryType>({
	fileId,
	entryConfigByExt,
	contentDir,
	fs,
}: GetEntryModuleParams<TEntryType>) {
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
	const entryConfig = entryConfigByExt.get(fileExt);

	if (!entryConfig) {
		throw new AstroError({
			...AstroErrorData.UnknownContentCollectionError,
			message: `No parser found for data entry ${JSON.stringify(
				fileId
			)}. Did you apply an integration for this file type?`,
		});
	}
	const entry = pathToFileURL(fileId);
	const collection = getEntryCollectionName({ entry, contentDir });
	if (collection === undefined) throw new AstroError(AstroErrorData.UnknownContentCollectionError);

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

/** Stringify entry `data` at build time to be used as a Vite module */
function stringifyEntryData(data: Record<string, any>): string {
	try {
		return devalue.uneval(data, (value) => {
			// Add support for URL objects
			if (value instanceof URL) {
				return `new URL(${JSON.stringify(value.href)})`;
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
