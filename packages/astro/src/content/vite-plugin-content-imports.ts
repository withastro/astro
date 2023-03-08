import * as devalue from 'devalue';
import type fsMod from 'node:fs';
import { extname } from 'node:path';
import { pathToFileURL } from 'url';
import type { Plugin } from 'vite';
import { normalizePath } from 'vite';
import { AstroSettings, ContentEntryType } from '../@types/astro.js';
import { AstroErrorData } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/errors.js';
import { escapeViteEnvReferences, getFileInfo } from '../vite-plugin-utils/index.js';
import { CONTENT_FLAG } from './consts.js';
import {
	ContentConfig,
	extractFrontmatterAssets,
	getContentEntryExts,
	getContentPaths,
	getEntryData,
	getEntryInfo,
	getEntrySlug,
	getEntryType,
	globalContentConfigObserver,
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
}): Plugin {
	const contentPaths = getContentPaths(settings.config, fs);
	const contentEntryExts = getContentEntryExts(settings);

	const contentEntryExtToParser: Map<string, ContentEntryType> = new Map();
	for (const entryType of settings.contentEntryTypes) {
		for (const ext of entryType.extensions) {
			contentEntryExtToParser.set(ext, entryType);
		}
	}

	return {
		name: 'astro:content-imports',
		async load(id) {
			const { fileId } = getFileInfo(id, settings.config);
			if (isContentFlagImport(id, contentEntryExts)) {
				const observable = globalContentConfigObserver.get();

				// Content config should be loaded before this plugin is used
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
				if (generatedInfo instanceof Error) return;

				const _internal = { filePath: fileId, rawData: info.rawData };
				// TODO: move slug calculation to the start of the build
				// to generate a performant lookup map for `getEntryBySlug`
				const slug = getEntrySlug({ ...generatedInfo, unvalidatedSlug: info.slug });

				const collectionConfig = contentConfig?.collections[generatedInfo.collection];
				const data = collectionConfig
					? await getEntryData(
							{ ...generatedInfo, _internal, unvalidatedData: info.data },
							collectionConfig
					  )
					: info.data;

				const images = extractFrontmatterAssets(data).map(
					(image) => `'${image}': await import('${normalizePath(image)}'),`
				);

				const code = escapeViteEnvReferences(`
export const id = ${JSON.stringify(generatedInfo.id)};
export const collection = ${JSON.stringify(generatedInfo.collection)};
export const slug = ${JSON.stringify(slug)};
export const body = ${JSON.stringify(info.body)};
const frontmatterImages = {
	${images.join('\n')}
}
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
						if (isContentFlagImport(modUrl, contentEntryExts)) {
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
	};
}
