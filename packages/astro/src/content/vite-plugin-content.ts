import { Plugin, normalizePath } from 'vite';
import glob from 'fast-glob';
import fsMod from 'node:fs';
import * as path from 'node:path';
import { bold, cyan } from 'kleur/colors';
import { info, LogOptions, warn } from '../core/logger/core.js';
import type { AstroSettings } from '../@types/astro.js';
import { appendForwardSlash, prependForwardSlash } from '../core/path.js';
import { contentFileExts, CONTENT_FLAG, VIRTUAL_MODULE_ID } from './consts.js';
import { escapeViteEnvReferences } from '../vite-plugin-utils/index.js';
import { pathToFileURL } from 'node:url';
import {
	CollectionConfig,
	ContentConfig,
	getEntryData,
	getEntrySlug,
	loadContentConfig,
	NotFoundError,
	parseFrontmatter,
} from './utils.js';
import * as devalue from 'devalue';

type Paths = {
	contentDir: URL;
	cacheDir: URL;
	generatedInputDir: URL;
	config: URL;
};

type ChokidarEvent = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
type ContentEvent = { name: ChokidarEvent; entry: string };
type EntryInfo = {
	id: string;
	slug: string;
	collection: string;
};

type GenerateContent = {
	init(): Promise<void>;
	queueEvent(event: ContentEvent): void;
};

type ContentTypes = Record<string, Record<string, string>>;

const CONTENT_BASE = 'types.generated';
const CONTENT_FILE = CONTENT_BASE + '.mjs';
const CONTENT_TYPES_FILE = CONTENT_BASE + '.d.ts';

const msg = {
	collectionAdded: (collection: string) => `${cyan(collection)} collection added`,
	entryAdded: (entry: string, collection: string) => `${cyan(entry)} added to ${bold(collection)}.`,
};

interface AstroContentVirtualModPluginParams {
	settings: AstroSettings;
}

export function astroContentVirtualModPlugin({
	settings,
}: AstroContentVirtualModPluginParams): Plugin {
	const paths = getPaths({ srcDir: settings.config.srcDir });
	const relContentDir = appendForwardSlash(
		prependForwardSlash(path.relative(settings.config.root.pathname, paths.contentDir.pathname))
	);
	const entryGlob = relContentDir + '**/*.{md,mdx}';
	const astroContentModContents = fsMod
		.readFileSync(new URL(CONTENT_FILE, paths.generatedInputDir), 'utf-8')
		.replace('@@CONTENT_DIR@@', relContentDir)
		.replace('@@ENTRY_GLOB_PATH@@', entryGlob)
		.replace('@@RENDER_ENTRY_GLOB_PATH@@', entryGlob);

	const astroContentVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

	return {
		name: 'astro-content-virtual-mod-plugin',
		enforce: 'pre',
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return astroContentVirtualModuleId;
			}
		},
		load(id) {
			if (id === astroContentVirtualModuleId) {
				return {
					code: astroContentModContents,
				};
			}
		},
	};
}

interface AstroContentServerPluginParams {
	fs: typeof fsMod;
	logging: LogOptions;
	settings: AstroSettings;
	contentConfig: ContentConfig | Error;
}

export function astroContentServerPlugin({
	fs,
	settings,
	contentConfig,
	logging,
}: AstroContentServerPluginParams): Plugin[] {
	const paths: Paths = getPaths({ srcDir: settings.config.srcDir });
	let contentDirExists = false;
	let contentGenerator: GenerateContent;

	async function createContentGenerator(): Promise<GenerateContent> {
		const contentTypes: ContentTypes = {};

		let events: Promise<void>[] = [];
		let debounceTimeout: NodeJS.Timeout | undefined;
		let eventsSettled: Promise<void> | undefined;

		const contentTypesBase = await fsMod.promises.readFile(
			new URL(CONTENT_TYPES_FILE, paths.generatedInputDir),
			'utf-8'
		);

		async function init() {
			const pattern = new URL('./**/', paths.contentDir).pathname + '*.{md,mdx}';
			const entries = await glob(pattern, {
				fs: {
					readdir: fs.readdir.bind(fs),
					readdirSync: fs.readdirSync.bind(fs),
				},
			});
			for (const entry of entries) {
				queueEvent({ name: 'add', entry }, { shouldLog: false });
			}
			await eventsSettled;
		}

		async function onEvent(event: ContentEvent, opts?: { shouldLog: boolean }) {
			const shouldLog = opts?.shouldLog ?? true;

			if (event.name === 'addDir' || event.name === 'unlinkDir') {
				const collection = path.relative(paths.contentDir.pathname, event.entry);
				// If directory is multiple levels deep, it is not a collection!
				const isCollectionEvent = collection.split(path.sep).length === 1;
				if (!isCollectionEvent) return;
				switch (event.name) {
					case 'addDir':
						addCollection(contentTypes, JSON.stringify(collection));
						if (shouldLog) {
							info(logging, 'content', msg.collectionAdded(collection));
						}
						break;
					case 'unlinkDir':
						removeCollection(contentTypes, JSON.stringify(collection));
						break;
				}
			} else {
				const fileType = getEntryType(event.entry, paths);
				if (fileType === 'config') {
					contentConfig = await loadContentConfig({ fs, settings });
					return;
				}
				if (fileType === 'unknown') {
					warn(
						logging,
						'content',
						`${cyan(
							path.relative(paths.contentDir.pathname, event.entry)
						)} is not a supported file type. Skipping.`
					);
					return;
				}
				const entryInfo = getEntryInfo({ entryPath: event.entry, contentDir: paths.contentDir });
				// Not a valid `src/content/` entry. Silently return, but should be impossible?
				if (entryInfo instanceof Error) return;

				const { id, slug, collection } = entryInfo;
				const collectionKey = JSON.stringify(collection);
				const entryKey = JSON.stringify(id);
				const collectionConfig =
					contentConfig instanceof Error ? undefined : contentConfig.collections[collection];
				switch (event.name) {
					case 'add':
						if (!(collectionKey in contentTypes)) {
							addCollection(contentTypes, collectionKey);
						}
						if (!(entryKey in contentTypes[collectionKey])) {
							addEntry(contentTypes, collectionKey, entryKey, slug, collectionConfig);
						}
						if (shouldLog) {
							info(logging, 'content', msg.entryAdded(entryInfo.slug, entryInfo.collection));
						}
						break;
					case 'unlink':
						if (collectionKey in contentTypes && entryKey in contentTypes[collectionKey]) {
							removeEntry(contentTypes, collectionKey, entryKey);
						}
						break;
					case 'change':
						// noop. Frontmatter types are inferred from collection schema import, so they won't change!
						break;
				}
			}
		}

		function queueEvent(event: ContentEvent, eventOpts?: { shouldLog: boolean }) {
			if (!event.entry.startsWith(paths.contentDir.pathname)) return;
			if (event.entry.endsWith(CONTENT_TYPES_FILE)) return;

			events.push(onEvent(event, eventOpts));
			runEventsDebounced();
		}

		function runEventsDebounced() {
			eventsSettled = new Promise((resolve, reject) => {
				try {
					debounceTimeout && clearTimeout(debounceTimeout);
					debounceTimeout = setTimeout(async () => {
						await Promise.all(events);
						await writeContentFiles({
							fs,
							contentTypes,
							paths,
							contentTypesBase,
							hasContentConfig: !(contentConfig instanceof NotFoundError),
						});
						resolve();
					}, 50 /* debounce 50 ms to batch chokidar events */);
				} catch (e) {
					reject(e);
				}
			});
		}
		return { init, queueEvent };
	}

	return [
		{
			name: 'content-flag-plugin',
			async load(id) {
				const { pathname, searchParams } = new URL(id, 'file://');
				if (isContentFlagImport({ pathname, searchParams })) {
					const rawContents = await fs.promises.readFile(pathname, 'utf-8');
					const {
						content: body,
						data: unparsedData,
						matter: rawData,
					} = parseFrontmatter(rawContents, pathname);
					const entryInfo = getEntryInfo({ entryPath: pathname, contentDir: paths.contentDir });
					if (entryInfo instanceof Error) return;

					const _internal = { filePath: pathname, rawData };
					const partialEntry = { data: unparsedData, body, _internal, ...entryInfo };
					const collectionConfig =
						contentConfig instanceof Error
							? undefined
							: contentConfig.collections[entryInfo.collection];
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
		{
			name: 'astro-content-server-plugin',
			async config() {
				try {
					await fs.promises.stat(paths.contentDir);
					contentDirExists = true;
				} catch {
					/* silently move on */
					return;
				}

				info(logging, 'content', 'Generating entries...');

				contentGenerator = await createContentGenerator();
				await contentGenerator.init();
			},
			async configureServer(viteServer) {
				if (contentDirExists) {
					info(
						logging,
						'content',
						`Watching ${cyan(
							paths.contentDir.href.replace(settings.config.root.href, '')
						)} for changes`
					);
					attachListeners();
				} else {
					viteServer.watcher.on('addDir', (dir) => {
						if (dir === paths.contentDir.pathname) {
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
							getEntryType(entry, paths) === 'config'
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
	];
}

export function getPaths({ srcDir }: { srcDir: URL }): Paths {
	return {
		// Output generated types in content directory. May change in the future!
		cacheDir: new URL('./content/', srcDir),
		contentDir: new URL('./content/', srcDir),
		generatedInputDir: new URL('../../src/content/template/', import.meta.url),
		config: new URL('./content/config', srcDir),
	};
}

function isContentFlagImport({ searchParams, pathname }: Pick<URL, 'searchParams' | 'pathname'>) {
	return searchParams.has(CONTENT_FLAG) && contentFileExts.some((ext) => pathname.endsWith(ext));
}

function addCollection(contentMap: ContentTypes, collectionKey: string) {
	contentMap[collectionKey] = {};
}

function removeCollection(contentMap: ContentTypes, collectionKey: string) {
	delete contentMap[collectionKey];
}

function addEntry(
	contentTypes: ContentTypes,
	collectionKey: string,
	entryKey: string,
	slug: string,
	collectionConfig?: CollectionConfig
) {
	const dataType = collectionConfig?.schema ? `InferEntrySchema<${collectionKey}>` : 'any';
	// If user has custom slug function, we can't predict slugs at type compilation.
	// Would require parsing all data and evaluating ahead-of-time;
	// We evaluate with lazy imports at dev server runtime
	// to prevent excessive errors
	const slugType = collectionConfig?.slug ? 'string' : JSON.stringify(slug);

	contentTypes[collectionKey][
		entryKey
	] = `{\n  id: ${entryKey},\n  slug: ${slugType},\n  body: string,\n  collection: ${collectionKey},\n  data: ${dataType}\n}`;
}

function removeEntry(contentTypes: ContentTypes, collectionKey: string, entryKey: string) {
	delete contentTypes[collectionKey][entryKey];
}

function getEntryInfo({
	entryPath,
	contentDir,
}: Pick<Paths, 'contentDir'> & { entryPath: string }): EntryInfo | Error {
	const relativeEntryPath = normalizePath(path.relative(contentDir.pathname, entryPath));
	const collection = path.dirname(relativeEntryPath).split(path.sep).shift();
	if (!collection) return new Error();

	const id = path.relative(collection, relativeEntryPath);
	const slug = id.replace(path.extname(id), '');
	return {
		id,
		slug,
		collection,
	};
}

function getEntryType(entryPath: string, paths: Paths): 'content' | 'config' | 'unknown' {
	const { dir, ext, name } = path.parse(entryPath);
	const { pathname } = new URL(name, appendForwardSlash(pathToFileURL(dir).href));
	if (['.md', '.mdx'].includes(ext)) {
		return 'content';
	} else if (pathname === paths.config.pathname) {
		return 'config';
	} else {
		return 'unknown';
	}
}

async function writeContentFiles({
	fs,
	paths,
	contentTypes,
	contentTypesBase,
	hasContentConfig,
}: {
	fs: typeof fsMod;
	paths: Paths;
	contentTypes: ContentTypes;
	contentTypesBase: string;
	hasContentConfig: boolean;
}) {
	let contentTypesStr = '';
	const collectionKeys = Object.keys(contentTypes).sort();
	for (const collectionKey of collectionKeys) {
		contentTypesStr += `${collectionKey}: {\n`;
		const entryKeys = Object.keys(contentTypes[collectionKey]).sort();
		for (const entryKey of entryKeys) {
			const entry = contentTypes[collectionKey][entryKey];
			contentTypesStr += `${entryKey}: ${entry},\n`;
		}
		contentTypesStr += `},\n`;
	}

	contentTypesBase = contentTypesBase.replace('// @@ENTRY_MAP@@', contentTypesStr);
	contentTypesBase = contentTypesBase.replace(
		"'@@CONTENT_CONFIG_TYPE@@'",
		hasContentConfig ? `typeof import(${JSON.stringify(paths.config.pathname)})` : 'never'
	);

	try {
		await fs.promises.stat(paths.cacheDir);
	} catch {
		await fs.promises.mkdir(paths.cacheDir);
	}

	await fs.promises.writeFile(new URL(CONTENT_TYPES_FILE, paths.cacheDir), contentTypesBase);
}
