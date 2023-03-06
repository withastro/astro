import * as devalue from 'devalue';
import type fsMod from 'node:fs';
import { pathToFileURL } from 'url';
import type { Plugin } from 'vite';
import { AstroSettings } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { escapeViteEnvReferences, getFileInfo } from '../vite-plugin-utils/index.js';
import { contentFileExts, CONTENT_FLAG } from './consts.js';
import {
	ContentConfig,
	getContentPaths,
	getEntryData,
	getEntryInfo,
	getEntrySlug,
	getEntryType,
	globalContentConfigObserver,
	loadContentConfig,
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

				// Content config is stored globally,
				// and can get blown away if Node invalidates the module.
				// This was discovered in CI when using Docker.
				// Reimport the config in this case.
				if (observable.status === 'init') {
					globalContentConfigObserver.set({ status: 'loading' });
					try {
						const config = await loadContentConfig({ fs, settings, viteServer });
						if (config) {
							globalContentConfigObserver.set({ status: 'loaded', config });
						} else {
							globalContentConfigObserver.set({ status: 'does-not-exist' });
						}
					} catch (e) {
						globalContentConfigObserver.set({
							status: 'error',
							error:
								e instanceof Error
									? e
									: new AstroError(AstroErrorData.UnknownContentCollectionError),
						});
					}
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

				const code = escapeViteEnvReferences(`
export const id = ${JSON.stringify(entryInfo.id)};
export const collection = ${JSON.stringify(entryInfo.collection)};
export const slug = ${JSON.stringify(slug)};
export const body = ${JSON.stringify(body)};
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
