import { Plugin, ErrorPayload as ViteErrorPayload, normalizePath } from 'vite';
import glob from 'fast-glob';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { bold, cyan } from 'kleur/colors';
import matter from 'gray-matter';
import { info, LogOptions, warn } from '../core/logger/core.js';
import type { AstroSettings } from '../@types/astro.js';

type TypedMapEntry = { key: string; value: string; type: string };
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
}): Plugin {
	const { root, srcDir } = settings.config;
	const dirs: Dirs = {
		cacheDir: new URL('./.astro/', root),
		contentDir: new URL('./content/', srcDir),
		generatedInputDir: new URL('../../', import.meta.url),
	};
	let contentDirExists = false;
	let contentGenerator: GenerateContent;

	return {
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
	};
}

type ChokidarEvent = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
type ContentEvent = { name: ChokidarEvent; entry: string };
type EntryInfo = {
	id: string;
	slug: string;
	collection: string;
};
type Entry = EntryInfo & {
	data: Record<string, any>;
	rawData: string;
	body: string;
};

type GenerateContent = {
	init(): Promise<void>;
	queueEvent(event: ContentEvent): void;
};

type StringifiedInfo = { stringifiedJs: string; stringifiedType: string };

async function toGenerateContent({
	logging,
	dirs,
}: {
	logging: LogOptions;
	dirs: Dirs;
}): Promise<GenerateContent> {
	const contentMap: Record<string, Record<string, StringifiedInfo>> = {};
	const schemaMap: Record<string, StringifiedInfo> = {};
	const renderContentMap: Record<string, string> = {};

	let events: Promise<void>[] = [];
	let debounceTimeout: NodeJS.Timeout | undefined;
	let eventsSettled: Promise<void> | undefined;

	let [generatedMaps, generatedMapTypes] = await Promise.all([
		fs.readFile(new URL(CONTENT_FILE, dirs.generatedInputDir), 'utf-8'),
		fs.readFile(new URL(CONTENT_TYPES_FILE, dirs.generatedInputDir), 'utf-8'),
	]);

	function runEventsDebounced() {
		eventsSettled = new Promise((resolve, reject) => {
			try {
				debounceTimeout && clearTimeout(debounceTimeout);
				debounceTimeout = setTimeout(async () => {
					await Promise.all(events);

					let contentMapStr = '';
					let contentMapTypesStr = '';
					for (const collectionKey in contentMap) {
						contentMapStr += `${collectionKey}: {\n`;
						contentMapTypesStr += `${collectionKey}: {\n`;
						for (const entryKey in contentMap[collectionKey]) {
							const entry = contentMap[collectionKey][entryKey];
							contentMapStr += stringifyObjKeyValue(entryKey, entry.stringifiedJs);
							contentMapTypesStr += stringifyObjKeyValue(entryKey, entry.stringifiedType);
						}
						contentMapStr += `},\n`;
						contentMapTypesStr += `},\n`;
					}

					let renderContentStr = '';
					for (const entryKey in renderContentMap) {
						renderContentStr += stringifyObjKeyValue(entryKey, renderContentMap[entryKey]);
					}

					let schemaMapStr = '';
					let schemaMapTypesStr = '';
					for (const collectionKey in schemaMap) {
						const entry = schemaMap[collectionKey];
						schemaMapStr += stringifyObjKeyValue(collectionKey, entry.stringifiedJs);
						schemaMapTypesStr += stringifyObjKeyValue(collectionKey, entry.stringifiedType);
					}

					generatedMaps = generatedMaps
						.replace('// GENERATED_CONTENT_MAP_ENTRIES', contentMapStr)
						.replace('// GENERATED_RENDER_CONTENT_MAP_ENTRIES', renderContentStr);
					generatedMapTypes = generatedMapTypes.replace(
						'// GENERATED_CONTENT_MAP_ENTRIES',
						contentMapTypesStr
					);
					generatedMaps = generatedMaps.replace('// GENERATED_SCHEMA_MAP_ENTRIES', schemaMapStr);
					generatedMapTypes = generatedMapTypes.replace(
						'// GENERATED_SCHEMA_MAP_ENTRIES',
						schemaMapTypesStr
					);

					try {
						await fs.stat(dirs.cacheDir);
					} catch {
						await fs.mkdir(dirs.cacheDir);
					}

					await Promise.all([
						fs.writeFile(new URL(CONTENT_FILE, dirs.cacheDir), generatedMaps),
						fs.writeFile(new URL(CONTENT_TYPES_FILE, dirs.cacheDir), generatedMapTypes),
					]);

					resolve();
				}, 50 /* debounce 50 ms to batch chokidar events */);
			} catch (e) {
				reject(e);
			}
		});
	}

	function stringifyObjKeyValue(key: string, value: string) {
		return `${key}: ${value},\n`;
	}

	function queueEvent(event: ContentEvent) {
		events.push(onEvent(event));
		runEventsDebounced();
	}

	async function init() {
		const pattern = new URL('./**/', dirs.contentDir).pathname + '{*.{md,mdx},~schema.{js,mjs,ts}}';
		const entries = await glob(pattern);
		for (const entry of entries) {
			queueEvent({ name: 'add', entry });
		}
		await eventsSettled;
	}

	async function onEvent(event: ContentEvent) {
		if (!event.entry.startsWith(dirs.contentDir.pathname)) return;

		if (event.name === 'addDir' || event.name === 'unlinkDir') {
			const collection = path.relative(dirs.contentDir.pathname, event.entry);
			const isCollectionEvent = collection.split(path.sep).length === 1;
			if (!isCollectionEvent) return;
			switch (event.name) {
				case 'addDir':
					addCollection(contentMap, collection, logging);
					break;
				case 'unlinkDir':
					delete contentMap[collection];
					break;
			}
		} else {
			const fileType = getEntryType(event.entry);
			if (fileType === 'unknown') {
				warn(logging, 'content', `${cyan(event.entry)} is not a supported file type. Skipping.`);
				return;
			}
			const entryInfo = parseEntryInfo(event.entry, dirs);
			// Not a valid `src/content/` entry. Silently return, but should be impossible?
			if (entryInfo instanceof Error) return;

			const { id, slug, collection } = entryInfo;
			const collectionKey = JSON.stringify(collection);
			if (fileType === 'schema') {
				if (event.name === 'add' && !(collectionKey in schemaMap)) {
					addSchema(schemaMap, collection, event.entry, logging);
				} else if (event.name === 'unlink' && collection in schemaMap) {
					delete schemaMap[collection];
				}
				return;
			}
			switch (event.name) {
				case 'add':
					if (!(collectionKey in contentMap)) {
						addCollection(contentMap, collection, logging);
					}
					await addEntry(contentMap, event.entry, { id, slug, collection }, logging);
					renderContentMap[JSON.stringify(id)] = `() => import(${JSON.stringify(event.entry)})`;
					break;
				case 'change':
					await changeEntry(contentMap, event.entry, { id, slug, collection });
					break;
				case 'unlink':
					delete contentMap[collection][path.relative(collection, id)];
					delete renderContentMap[event.entry];
					break;
			}
		}
	}
	return { init, queueEvent };
}

function addCollection(contentMap: Record<string, any>, collection: string, logging: LogOptions) {
	contentMap[JSON.stringify(collection)] = {};
	info(logging, 'content', `${cyan(collection)} collection added`);
}

function addSchema(
	schemaMap: Record<string, StringifiedInfo>,
	collection: string,
	entryPath: string,
	logging: LogOptions
) {
	const { dir, name } = path.parse(entryPath);
	const pathWithExtStripped = path.join(dir, name);
	const importStr = `import(${JSON.stringify(pathWithExtStripped)})`;
	schemaMap[JSON.stringify(collection)] = {
		stringifiedJs: importStr,
		stringifiedType: `typeof ${importStr}`,
	};
	info(logging, 'content', `Schema added to ${collection}`);
}

async function changeEntry(
	contentMap: Record<string, Record<string, { stringifiedJs: string; stringifiedType: string }>>,
	entry: string,
	{ id, slug, collection }: EntryInfo
) {
	const body = await fs.readFile(entry, 'utf-8');
	const { data, matter: rawData = '' } = parseFrontmatter(body, entry);
	const collectionKey = JSON.stringify(collection);
	const entryKey = JSON.stringify(path.relative(collection, id));
	contentMap[collectionKey][entryKey] = {
		stringifiedJs: JSON.stringify({
			id,
			slug,
			data,
			body,
			rawData,
		}),
		stringifiedType:
			contentMap[collectionKey][entryKey]?.stringifiedType ??
			// only do work of stringifying type for new entries
			`{\n id: ${JSON.stringify(id)},\n  slug: ${JSON.stringify(
				slug
			)},\n  body: string,\n data: z.infer<Awaited<typeof schemaMap[${JSON.stringify(
				collection
			)}]>['schema']>\n}`,
	};
}

async function addEntry(
	contentMap: Record<string, any>,
	entry: string,
	entryInfo: EntryInfo,
	logging: LogOptions
) {
	await changeEntry(contentMap, entry, entryInfo);
	info(logging, 'content', `${cyan(entryInfo.slug)} added to ${bold(entryInfo.collection)}.`);
}

function parseEntryInfo(
	entryPath: string,
	{ contentDir }: Pick<Dirs, 'contentDir'>
): EntryInfo | Error {
	const id = normalizePath(path.relative(contentDir.pathname, entryPath));
	const collection = path.dirname(id).split(path.sep).shift();
	if (!collection) return new Error();

	const slug = path.relative(collection, id).replace(path.extname(id), '');
	return {
		id,
		slug,
		collection,
	};
}

function getEntryType(entryPath: string): 'content' | 'schema' | 'unknown' {
	const { base, ext } = path.parse(entryPath);
	if (['.md', '.mdx'].includes(ext)) {
		return 'content';
	} else if (['~schema.js', '~schema.mjs', '~schema.ts'].includes(base)) {
		return 'schema';
	} else {
		return 'unknown';
	}
}

/**
 * Match YAML exception handling from Astro core errors
 * @see 'astro/src/core/errors.ts'
 */
export function parseFrontmatter(fileContents: string, filePath: string) {
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
