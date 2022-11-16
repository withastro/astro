import { Plugin, ErrorPayload as ViteErrorPayload, normalizePath } from 'vite';
import glob from 'fast-glob';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';
import { bold, cyan } from 'kleur/colors';
import matter from 'gray-matter';
import { info, LogOptions, warn } from '../core/logger/core.js';
import type { AstroSettings } from '../@types/astro.js';
import { appendForwardSlash, prependForwardSlash } from '../core/path.js';
import { contentFileExts, CONTENT_FLAG } from './consts.js';

type Dirs = {
	contentDir: URL;
	cacheDir: URL;
	generatedInputDir: URL;
};

const CONTENT_BASE = 'content-generated';
const CONTENT_FILE = CONTENT_BASE + '.mjs';
const CONTENT_TYPES_FILE = CONTENT_BASE + '.d.ts';

export function astroContentPlugin({
	settings,
	logging,
}: {
	logging: LogOptions;
	settings: AstroSettings;
}): Plugin[] {
	const { root, srcDir } = settings.config;
	const dirs: Dirs = {
		cacheDir: new URL('./.astro/', root),
		contentDir: new URL('./content/', srcDir),
		generatedInputDir: new URL('../../', import.meta.url),
	};
	let contentDirExists = false;
	let contentGenerator: GenerateContent;

	const relContentDir = appendForwardSlash(
		prependForwardSlash(path.relative(settings.config.root.pathname, dirs.contentDir.pathname))
	);
	const entryGlob = relContentDir + '**/*.{md,mdx}';
	const schemaGlob = relContentDir + '**/index.{ts,js,mjs}';
	const astroContentModContents = fsSync
		.readFileSync(new URL(CONTENT_FILE, dirs.generatedInputDir), 'utf-8')
		.replace('@@CONTENT_DIR@@', relContentDir)
		.replace('@@ENTRY_GLOB_PATH@@', entryGlob)
		.replace('@@RENDER_ENTRY_GLOB_PATH@@', entryGlob)
		.replace('@@SCHEMA_GLOB_PATH@@', schemaGlob);

	const virtualModuleId = 'astro:content';
	const resolvedVirtualModuleId = '\0' + virtualModuleId;

	return [
		{
			name: 'astro-content-virtual-module-plugin',
			resolveId(id) {
				if (id === virtualModuleId) {
					return resolvedVirtualModuleId;
				}
			},
			load(id) {
				if (id === resolvedVirtualModuleId) {
					return {
						code: astroContentModContents,
					};
				}
			},
		},
		{
			name: 'content-flag-plugin',
			enforce: 'pre',
			async load(id) {
				const { pathname, searchParams } = new URL(id, 'file://');
				if (
					searchParams.has(CONTENT_FLAG) &&
					contentFileExts.some((ext) => pathname.endsWith(ext))
				) {
					const rawContents = await fs.readFile(pathname, 'utf-8');
					const { content: body, data, matter: rawData } = parseFrontmatter(rawContents, pathname);
					const entryInfo = parseEntryInfo(pathname, { contentDir: dirs.contentDir });
					if (entryInfo instanceof Error) return;
					return {
						code: `
export const id = ${JSON.stringify(entryInfo.id)};
export const collection = ${JSON.stringify(entryInfo.collection)};
export const slug = ${JSON.stringify(entryInfo.slug)};
export const body = ${JSON.stringify(body)};
export const data = ${JSON.stringify(data)};
export const _internal = {
	filePath: ${JSON.stringify(pathname)},
	rawData: ${JSON.stringify(rawData)},
};
`,
					};
				}
			},
		},
		{
			name: 'astro-fetch-content-plugin',
			async config() {
				try {
					await fs.stat(dirs.contentDir);
					contentDirExists = true;
				} catch {
					/* silently move on */
					return;
				}

				info(logging, 'content', 'Generating entries...');

				contentGenerator = await toGenerateContent({ logging, dirs });
				await contentGenerator.init();
			},
			async configureServer(viteServer) {
				if (contentDirExists) {
					info(
						logging,
						'content',
						`Watching ${cyan(dirs.contentDir.href.replace(root.href, ''))} for changes`
					);
					attachListeners();
				} else {
					viteServer.watcher.on('addDir', (dir) => {
						if (dir === dirs.contentDir.pathname) {
							info(logging, 'content', `Content dir found. Watching for changes`);
							contentDirExists = true;
							attachListeners();
						}
					});
				}

				function attachListeners() {
					viteServer.watcher.on('add', (entry) =>
						contentGenerator.queueEvent({ name: 'add', entry })
					);
					viteServer.watcher.on('addDir', (entry) =>
						contentGenerator.queueEvent({ name: 'addDir', entry })
					);
					viteServer.watcher.on('change', (entry) =>
						contentGenerator.queueEvent({ name: 'change', entry })
					);
					viteServer.watcher.on('unlink', (entry) =>
						contentGenerator.queueEvent({ name: 'unlink', entry })
					);
					viteServer.watcher.on('unlinkDir', (entry) =>
						contentGenerator.queueEvent({ name: 'unlinkDir', entry })
					);
				}
			},
		},
	];
}

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
type SchemaTypes = Record<string, string>;

const msg = {
	schemaAdded: (collection: string) => `${cyan(collection)} schema added`,
	collectionAdded: (collection: string) => `${cyan(collection)} collection added`,
	entryAdded: (entry: string, collection: string) => `${cyan(entry)} added to ${bold(collection)}.`,
};

async function toGenerateContent({
	logging,
	dirs,
}: {
	logging: LogOptions;
	dirs: Dirs;
}): Promise<GenerateContent> {
	const contentTypes: ContentTypes = {};
	const schemaTypes: SchemaTypes = {};

	let events: Promise<void>[] = [];
	let debounceTimeout: NodeJS.Timeout | undefined;
	let eventsSettled: Promise<void> | undefined;

	const contentTypesBase = await fs.readFile(
		new URL(CONTENT_TYPES_FILE, dirs.generatedInputDir),
		'utf-8'
	);

	async function init() {
		const pattern = new URL('./**/', dirs.contentDir).pathname + '{*.{md,mdx},index.{js,mjs,ts}}';
		const entries = await glob(pattern);
		for (const entry of entries) {
			queueEvent({ name: 'add', entry }, { shouldLog: false });
		}
		await eventsSettled;
	}

	async function onEvent(event: ContentEvent, opts?: { shouldLog: boolean }) {
		const shouldLog = opts?.shouldLog ?? true;

		if (event.name === 'addDir' || event.name === 'unlinkDir') {
			const collection = path.relative(dirs.contentDir.pathname, event.entry);
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
			const fileType = getEntryType(event.entry);
			if (fileType === 'unknown') {
				warn(
					logging,
					'content',
					`${cyan(
						path.relative(dirs.contentDir.pathname, event.entry)
					)} is not a supported file type. Skipping.`
				);
				return;
			}
			const entryInfo = parseEntryInfo(event.entry, dirs);
			// Not a valid `src/content/` entry. Silently return, but should be impossible?
			if (entryInfo instanceof Error) return;

			const { id, slug, collection } = entryInfo;
			const collectionKey = JSON.stringify(collection);
			const entryKey = JSON.stringify(id);
			if (fileType === 'collection-config') {
				switch (event.name) {
					case 'add':
						if (!(collectionKey in schemaTypes)) {
							addSchema(schemaTypes, collectionKey, event.entry);
							if (shouldLog) {
								info(logging, 'content', msg.schemaAdded(collection));
							}
						}
						break;
					case 'unlink':
						if (collectionKey in schemaTypes) {
							removeSchema(schemaTypes, collectionKey);
						}
						break;
					case 'change':
						// noop. Types use `typeof import`, so they won't change!
						break;
				}
				return;
			} else {
				switch (event.name) {
					case 'add':
						if (!(collectionKey in contentTypes)) {
							addCollection(contentTypes, collectionKey);
						}
						if (!(entryKey in contentTypes[collectionKey])) {
							addEntry(contentTypes, collectionKey, entryKey, slug);
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
						// noop. Frontmatter types are inferred from schema, so they won't change!
						break;
				}
			}
		}
	}

	function queueEvent(event: ContentEvent, eventOpts?: { shouldLog: boolean }) {
		if (!event.entry.startsWith(dirs.contentDir.pathname)) return;

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
						contentTypes,
						schemaTypes,
						dirs,
						contentTypesBase,
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

function addCollection(contentMap: ContentTypes, collectionKey: string) {
	contentMap[collectionKey] = {};
}

function removeCollection(contentMap: ContentTypes, collectionKey: string) {
	delete contentMap[collectionKey];
}

function addSchema(schemaTypes: SchemaTypes, collectionKey: string, entryPath: string) {
	const { dir, name } = path.parse(entryPath);
	const pathWithExtStripped = path.join(dir, name);
	const importStr = `import(${JSON.stringify(pathWithExtStripped)})`;
	schemaTypes[collectionKey] = `typeof ${importStr}`;
}

function removeSchema(schemaTypes: SchemaTypes, collectionKey: string) {
	delete schemaTypes[collectionKey];
}

function addEntry(
	contentTypes: ContentTypes,
	collectionKey: string,
	entryKey: string,
	slug: string
) {
	contentTypes[collectionKey][entryKey] = `{\n  id: ${entryKey},\n  slug: ${JSON.stringify(
		slug
	)},\n  body: string,\n  collection: ${collectionKey},\n  data: import('zod').infer<typeof schemaMap[${collectionKey}]['default']['schema']>\n}`;
}

function removeEntry(contentTypes: ContentTypes, collectionKey: string, entryKey: string) {
	delete contentTypes[collectionKey][entryKey];
}

function parseEntryInfo(
	entryPath: string,
	{ contentDir }: Pick<Dirs, 'contentDir'>
): EntryInfo | Error {
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

function getEntryType(entryPath: string): 'content' | 'collection-config' | 'unknown' {
	const { base, ext } = path.parse(entryPath);
	if (['.md', '.mdx'].includes(ext)) {
		return 'content';
	} else if (['index.js', 'index.mjs', 'index.ts'].includes(base)) {
		return 'collection-config';
	} else {
		return 'unknown';
	}
}

/**
 * Match YAML exception handling from Astro core errors
 * @see 'astro/src/core/errors.ts'
 */
function parseFrontmatter(fileContents: string, filePath: string) {
	try {
		return matter(fileContents);
	} catch (e: any) {
		if (e.name === 'YAMLException') {
			const err: Error & ViteErrorPayload['err'] = e;
			err.id = filePath;
			err.loc = { file: e.id, line: e.mark.line + 1, column: e.mark.column };
			err.message = e.reason;
			throw err;
		} else {
			throw e;
		}
	}
}

function stringifyObjKeyValue(key: string, value: string) {
	return `${key}: ${value},\n`;
}

async function writeContentFiles({
	dirs,
	contentTypes,
	schemaTypes,
	contentTypesBase,
}: {
	dirs: Dirs;
	contentTypes: ContentTypes;
	schemaTypes: SchemaTypes;
	contentTypesBase: string;
}) {
	let contentTypesStr = '';
	for (const collectionKey in contentTypes) {
		contentTypesStr += `${collectionKey}: {\n`;
		for (const entryKey in contentTypes[collectionKey]) {
			const entry = contentTypes[collectionKey][entryKey];
			contentTypesStr += stringifyObjKeyValue(entryKey, entry);
		}
		contentTypesStr += `},\n`;
	}

	let schemaTypesStr = '';
	for (const collectionKey in schemaTypes) {
		const entry = schemaTypes[collectionKey];
		schemaTypesStr += stringifyObjKeyValue(collectionKey, entry);
	}

	contentTypesBase = contentTypesBase.replace('// @@ENTRY_MAP@@', contentTypesStr);
	contentTypesBase = contentTypesBase.replace('// @@SCHEMA_MAP@@', schemaTypesStr);

	try {
		await fs.stat(dirs.cacheDir);
	} catch {
		await fs.mkdir(dirs.cacheDir);
	}

	await fs.writeFile(new URL(CONTENT_TYPES_FILE, dirs.cacheDir), contentTypesBase);
}
