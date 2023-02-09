import * as devalue from 'devalue';
import type fsMod from 'node:fs';
import { extname } from 'node:path';
import { pathToFileURL } from 'url';
import type { Plugin } from 'vite';
import { AstroSettings } from '../@types/astro.js';
import { AstroErrorData } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/errors.js';
import { escapeViteEnvReferences, getFileInfo } from '../vite-plugin-utils/index.js';
import { CONTENT_FLAG } from './consts.js';
import {
	ContentConfig,
	getContentEntryExts,
	getContentPaths,
	getEntryData,
	getEntryInfo,
	getEntrySlug,
	getEntryType,
	globalContentConfigObserver,
	loadContentEntryParsers,
	parseFrontmatter,
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
	const contentPaths = getContentPaths(settings.config);
	const contentEntryExts = getContentEntryExts(settings);

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

				const contentEntryParsers = await loadContentEntryParsers({ settings });
				const rawContents = await fs.promises.readFile(fileId, 'utf-8');
				const fileExt = extname(fileId);
				const contentEntryParser = contentEntryParsers.get(fileExt);
				// if (!contentEntryParser) {
				// 	throw new AstroError({
				// 		...AstroErrorData.UnknownContentCollectionError,
				// 		message: `No content parser found for file extension "${fileExt}".`,
				// 	});
				// }
				let body: string,
					unvalidatedData: Record<string, unknown>,
					unvalidatedSlug: string,
					rawData: string;
				if (contentEntryParser) {
					const info = await contentEntryParser.getEntryInfo({
						fileUrl: pathToFileURL(fileId),
						contents: rawContents,
					});
					body = info.body;
					unvalidatedData = info.data;
					unvalidatedSlug = info.slug;
					rawData = info.rawData;
				} else {
					const parsed = parseFrontmatter(rawContents, fileId);
					body = parsed.content;
					unvalidatedData = parsed.data;
					unvalidatedSlug = parsed.data.slug;
					rawData = parsed.matter;
				}

				const entryInfo = getEntryInfo({
					entry: pathToFileURL(fileId),
					contentDir: contentPaths.contentDir,
				});
				if (entryInfo instanceof Error) return;

				const _internal = { filePath: fileId, rawData };
				// TODO: move slug calculation to the start of the build
				// to generate a performant lookup map for `getEntryBySlug`
				const slug = getEntrySlug({ ...entryInfo, unvalidatedSlug });

				const collectionConfig = contentConfig?.collections[entryInfo.collection];
				const data = collectionConfig
					? await getEntryData({ ...entryInfo, _internal, unvalidatedData }, collectionConfig)
					: unvalidatedData;

				const code = escapeViteEnvReferences(`
export const id = ${JSON.stringify(entryInfo.id)};
export const collection = ${JSON.stringify(entryInfo.collection)};
export const slug = ${JSON.stringify(slug)};
export const body = ${JSON.stringify(body)};
export const data = ${devalue.uneval(data) /* TODO: reuse astro props serializer */};
export const _internal = {
	filePath: ${JSON.stringify(fileId)},
	rawData: ${JSON.stringify(unvalidatedData)},
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
