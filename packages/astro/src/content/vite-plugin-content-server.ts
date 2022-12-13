import type { Plugin } from 'vite';
import fsMod from 'node:fs';
import { cyan } from 'kleur/colors';
import { info, LogOptions } from '../core/logger/core.js';
import type { AstroSettings } from '../@types/astro.js';
import { contentFileExts, CONTENT_FLAG } from './consts.js';
import { escapeViteEnvReferences } from '../vite-plugin-utils/index.js';
import {
	getEntryData,
	getEntrySlug,
	getContentPaths,
	loadContentConfig,
	contentObservable,
	parseFrontmatter,
	ContentPaths,
} from './utils.js';
import * as devalue from 'devalue';
import {
	createContentTypesGenerator,
	GenerateContentTypes,
	getEntryInfo,
	getEntryType,
} from './types-generator.js';

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

				contentConfigObserver.set({ status: 'loading' });
				const config = await loadContentConfig({ fs, settings });
				if (config instanceof Error) {
					contentConfigObserver.set({ status: 'error', error: config });
				} else {
					contentConfigObserver.set({ status: 'loaded', config });
				}

				if (mode === 'dev' || viteConfig.build?.ssr === true) {
					info(logging, 'content', 'Generating entries...');
					contentGenerator = await createContentTypesGenerator({
						fs,
						settings,
						logging,
						contentConfigObserver,
						contentPaths,
					});
					await contentGenerator.init();
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
						if (dir === contentPaths.contentDir.pathname) {
							info(logging, 'content', `Content dir found. Watching for changes`);
							contentDirExists = true;
							attachListeners();
						}
					});
				}

				function attachListeners() {
					viteServer.watcher.on('all', async (event, entry) => {
						if (
							['add', 'unlink', 'change'].includes(event) &&
							getEntryType(entry, contentPaths) === 'config'
						) {
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
				const { pathname, searchParams } = new URL(id, 'file://');
				if (isContentFlagImport({ pathname, searchParams })) {
					if (contentConfigObserver.get().status === 'loading') {
						await new Promise((resolve) => {
							const unsubscribe = contentConfigObserver.subscribe((ctx) => {
								if (ctx.status === 'loaded') {
									unsubscribe();
									resolve(undefined);
								}
							});
						});
					}
					const observable = contentConfigObserver.get();
					const rawContents = await fs.promises.readFile(pathname, 'utf-8');
					const {
						content: body,
						data: unparsedData,
						matter: rawData = '',
					} = parseFrontmatter(rawContents, pathname);
					const entryInfo = getEntryInfo({
						entryPath: pathname,
						contentDir: contentPaths.contentDir,
					});
					if (entryInfo instanceof Error) return;

					const _internal = { filePath: pathname, rawData };
					const partialEntry = { data: unparsedData, body, _internal, ...entryInfo };
					const collectionConfig =
						observable.status === 'loaded'
							? observable.config.collections[entryInfo.collection]
							: undefined;
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
	filePath: ${JSON.stringify(pathname)},
	rawData: ${JSON.stringify(rawData)},
};
`);
					return { code };
				}
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
