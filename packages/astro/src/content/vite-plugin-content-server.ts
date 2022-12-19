import * as devalue from 'devalue';
import { cyan } from 'kleur/colors';
import fsMod from 'node:fs';
import { pathToFileURL } from 'node:url';
import type { Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { info, LogOptions } from '../core/logger/core.js';
import { prependForwardSlash } from '../core/path.js';
import { escapeViteEnvReferences } from '../vite-plugin-utils/index.js';
import { contentFileExts, CONTENT_FLAG } from './consts.js';
import {
	createContentTypesGenerator,
	GenerateContentTypes,
	getEntryInfo,
	getEntryType,
} from './types-generator.js';
import {
	ContentConfig,
	contentObservable,
	ContentPaths,
	getContentPaths,
	getEntryData,
	getEntrySlug,
	parseFrontmatter,
} from './utils.js';

interface AstroContentServerPluginParams {
	fs: typeof fsMod;
	logging: LogOptions;
	settings: AstroSettings;
	mode: string;
}

export function astroContentServerPlugin({
	fs,
	settings,
	logging,
	mode,
}: AstroContentServerPluginParams): Plugin[] {
	const contentPaths: ContentPaths = getContentPaths({ srcDir: settings.config.srcDir });
	let contentDirExists = false;
	let contentGenerator: GenerateContentTypes;
	const contentConfigObserver = contentObservable({ status: 'loading' });

	return [
		{
			name: 'astro-content-server-plugin',
			async config(viteConfig) {
				try {
					await fs.promises.stat(contentPaths.contentDir);
					contentDirExists = true;
				} catch {
					/* silently move on */
					return;
				}

				if (contentDirExists && (mode === 'dev' || viteConfig.build?.ssr === true)) {
					contentGenerator = await createContentTypesGenerator({
						fs,
						settings,
						logging,
						contentConfigObserver,
					});
					await contentGenerator.init();
					info(logging, 'content', 'Types generated');
				}
			},
			async configureServer(viteServer) {
				if (mode !== 'dev') return;

				if (contentDirExists) {
					info(
						logging,
						'content',
						`Watching ${cyan(
							contentPaths.contentDir.href.replace(settings.config.root.href, '')
						)} for changes`
					);
					attachListeners();
				} else {
					viteServer.watcher.on('addDir', (dir) => {
						if (pathToFileURL(dir).href === contentPaths.contentDir.href) {
							info(logging, 'content', `Content dir found. Watching for changes`);
							contentDirExists = true;
							attachListeners();
						}
					});
				}

				function attachListeners() {
					viteServer.watcher.on('add', (entry) => {
						contentGenerator.queueEvent({ name: 'add', entry });
					});
					viteServer.watcher.on('addDir', (entry) =>
						contentGenerator.queueEvent({ name: 'addDir', entry })
					);
					viteServer.watcher.on('change', (entry) =>
						contentGenerator.queueEvent({ name: 'change', entry })
					);
					viteServer.watcher.on('unlink', (entry) => {
						contentGenerator.queueEvent({ name: 'unlink', entry });
					});
					viteServer.watcher.on('unlinkDir', (entry) =>
						contentGenerator.queueEvent({ name: 'unlinkDir', entry })
					);
				}
			},
		},
		{
			name: 'astro-content-flag-plugin',
			async load(id) {
				const fileUrl = new URL(prependForwardSlash(id), 'file://');
				if (isContentFlagImport(fileUrl)) {
					const observable = contentConfigObserver.get();
					let contentConfig: ContentConfig | undefined =
						observable.status === 'loaded' ? observable.config : undefined;
					if (observable.status === 'loading') {
						// Wait for config to load
						contentConfig = await new Promise((resolve) => {
							const unsubscribe = contentConfigObserver.subscribe((ctx) => {
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
					const rawContents = await fs.promises.readFile(fileUrl, 'utf-8');
					const {
						content: body,
						data: unparsedData,
						matter: rawData = '',
					} = parseFrontmatter(rawContents, fileUrl.pathname);
					const entryInfo = getEntryInfo({
						entry: fileUrl,
						contentDir: contentPaths.contentDir,
					});
					if (entryInfo instanceof Error) return;

					const _internal = { filePath: fileUrl.pathname, rawData };
					const partialEntry = { data: unparsedData, body, _internal, ...entryInfo };
					const collectionConfig = contentConfig?.collections[entryInfo.collection];
					const data = collectionConfig
						? await getEntryData(partialEntry, collectionConfig)
						: unparsedData;
					const slug = collectionConfig
						? await getEntrySlug({ ...partialEntry, data }, collectionConfig)
						: entryInfo.slug;

					const code = escapeViteEnvReferences(`
export const id = ${JSON.stringify(entryInfo.id)};
export const collection = ${JSON.stringify(entryInfo.collection)};
export const slug = ${JSON.stringify(slug)};
export const body = ${JSON.stringify(body)};
export const data = ${devalue.uneval(data) /* TODO: reuse astro props serializer */};
export const _internal = {
	filePath: ${JSON.stringify(fileUrl.pathname)},
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
							if (isContentFlagImport(new URL(modUrl, 'file://'))) {
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
				if (isContentFlagImport(new URL(id, 'file://'))) {
					// Escape before Rollup internal transform.
					// Base on MUCH trial-and-error, inspired by MDX integration 2-step transform.
					return { code: escapeViteEnvReferences(code) };
				}
			},
		},
	];
}

function isContentFlagImport({ searchParams, pathname }: Pick<URL, 'searchParams' | 'pathname'>) {
	return searchParams.has(CONTENT_FLAG) && contentFileExts.some((ext) => pathname.endsWith(ext));
}
