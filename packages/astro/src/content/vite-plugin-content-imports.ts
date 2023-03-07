import * as devalue from 'devalue';
import type fsMod from 'node:fs';
import { pathToFileURL } from 'url';
import type { Plugin } from 'vite';
import { normalizePath } from 'vite';
import { AstroSettings } from '../@types/astro.js';
import { AstroErrorData } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/errors.js';
import { escapeViteEnvReferences, getFileInfo } from '../vite-plugin-utils/index.js';
import { contentFileExts, CONTENT_FLAG } from './consts.js';
import {
	ContentConfig,
	extractFrontmatterAssets,
	getContentPaths,
	getEntryData,
	getEntryInfo,
	getEntrySlug,
	getEntryType,
	globalContentConfigObserver,
	parseFrontmatter,
} from './utils.js';

function isContentFlagImport(viteId: string) {
	const { pathname, searchParams } = new URL(viteId, 'file://');
	return searchParams.has(CONTENT_FLAG) && contentFileExts.some((ext) => pathname.endsWith(ext));
}

export function astroContentImportPlugin({
	fs,
	settings,
}: {
	fs: typeof fsMod;
	settings: AstroSettings;
}): Plugin {
	const contentPaths = getContentPaths(settings.config, fs);

	return {
		name: 'astro:content-imports',
		async load(id) {
			const { fileId } = getFileInfo(id, settings.config);
			if (isContentFlagImport(id)) {
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
				const {
					content: body,
					data: unparsedData,
					matter: rawData = '',
				} = parseFrontmatter(rawContents, fileId);
				const entryInfo = getEntryInfo({
					entry: pathToFileURL(fileId),
					contentDir: contentPaths.contentDir,
				});
				if (entryInfo instanceof Error) return;

				const _internal = { filePath: fileId, rawData };
				const partialEntry = { data: unparsedData, body, _internal, ...entryInfo };
				// TODO: move slug calculation to the start of the build
				// to generate a performant lookup map for `getEntryBySlug`
				const slug = getEntrySlug(partialEntry);

				const collectionConfig = contentConfig?.collections[entryInfo.collection];
				const data = collectionConfig
					? await getEntryData(partialEntry, collectionConfig)
					: unparsedData;

				const images = extractFrontmatterAssets(data).map(
					(image) => `'${image}': await import('${normalizePath(image)}'),`
				);

				const code = escapeViteEnvReferences(`
export const id = ${JSON.stringify(entryInfo.id)};
export const collection = ${JSON.stringify(entryInfo.collection)};
export const slug = ${JSON.stringify(slug)};
export const body = ${JSON.stringify(body)};
const frontmatterImages = {
	${images.join('\n')}
}
export const data = ${devalue.uneval(data) /* TODO: reuse astro props serializer */};
export const _internal = {
	filePath: ${JSON.stringify(fileId)},
	rawData: ${JSON.stringify(rawData)},
};
`);
				return { code };
			}
		},
		configureServer(viteServer) {
			viteServer.watcher.on('all', async (event, entry) => {
				if (
					['add', 'unlink', 'change'].includes(event) &&
					getEntryType(entry, contentPaths) === 'config'
				) {
					// Content modules depend on config, so we need to invalidate them.
					for (const modUrl of viteServer.moduleGraph.urlToModuleMap.keys()) {
						if (isContentFlagImport(modUrl)) {
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
			if (isContentFlagImport(id)) {
				// Escape before Rollup internal transform.
				// Base on MUCH trial-and-error, inspired by MDX integration 2-step transform.
				return { code: escapeViteEnvReferences(code) };
			}
		},
	};
}
