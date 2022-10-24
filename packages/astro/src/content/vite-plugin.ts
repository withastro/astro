import type { Plugin, ErrorPayload as ViteErrorPayload } from 'vite';
import glob from 'fast-glob';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { cyan } from 'kleur/colors';
import matter from 'gray-matter';
import { info, LogOptions } from '../core/logger/core.js';
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

	return {
		name: 'astro-fetch-content-plugin',
		async config() {
			try {
				await fs.stat(dirs.contentDir);
				contentDirExists = true;
			} catch {
				console.log('No content directory found!', dirs.contentDir);
			}

			if (!contentDirExists) return;

			info(logging, 'content', 'Generating entries...');
			await generateContent(logging, dirs);
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
					console.log({ dir, path: dirs.contentDir.pathname });
					if (dir === dirs.contentDir.pathname) {
						info(logging, 'content', `Content dir found. Watching for changes`);
						contentDirExists = true;
						attachListeners();
					}
				});
			}

			function attachListeners() {
				viteServer.watcher.on('add', (file) => generateContent(logging, dirs, 'add', file));
				viteServer.watcher.on('addDir', (file) => generateContent(logging, dirs, 'addDir', file));
				viteServer.watcher.on('change', (file) => generateContent(logging, dirs, 'change', file));
				viteServer.watcher.on('unlink', (file) => generateContent(logging, dirs, 'unlink', file));
				viteServer.watcher.on('unlinkDir', (file) =>
					generateContent(logging, dirs, 'unlinkDir', file)
				);
			}
		},
	};
}

type Entry = [
	entryKey: string,
	value: { id: string; slug: string; data: any; body: string; rawData: string }
];
type CollectionEntry = [collectionName: string, entries: Entry[]];

async function generateContent(
	logging: LogOptions,
	dirs: Dirs,
	chokidarEvent?: string,
	entryChanged?: string
) {
	if (chokidarEvent && !entryChanged?.startsWith(dirs.contentDir.pathname)) return;

	if (chokidarEvent === 'addDir') {
		info(
			logging,
			'content',
			`${cyan(getCollectionName(entryChanged ?? '', dirs))} collection added`
		);
	}

	let [generatedMaps, generatedMapTypes] = await Promise.all([
		fs.readFile(new URL(CONTENT_FILE, dirs.generatedInputDir), 'utf-8'),
		fs.readFile(new URL(CONTENT_TYPES_FILE, dirs.generatedInputDir), 'utf-8'),
	]);

	const collections = await glob(new URL('*', dirs.contentDir).pathname, { onlyDirectories: true });

	const [contentEntries, schemaEntries] = await Promise.all([
		getContentMapEntries(collections, dirs),
		getSchemaMapEntries(collections, dirs),
	]);
	let contentMapStr = '';
	let contentMapTypesStr = '';
	for (const [collectionName, entries] of contentEntries) {
		contentMapStr += `${JSON.stringify(collectionName)}: ${JSON.stringify(
			Object.fromEntries(entries),
			null,
			2
		)},`;
		const types = entries.map(([key, { id, slug }]) => {
			return [
				key,
				`{\n id: ${JSON.stringify(id)},\n  slug: ${JSON.stringify(
					slug
				)},\n  body: string,\n data: z.infer<Awaited<typeof schemaMap[${JSON.stringify(
					collectionName
				)}]>['schema']>\n}`,
			];
		});
		contentMapTypesStr += `${JSON.stringify(collectionName)}: {\n${types.map(
			([key, stringifiedValue]) => `${JSON.stringify(key)}: ${stringifiedValue}`
		)}\n},`;
	}

	let schemaMapStr = '';
	let schemaMapTypesStr = '';
	for (const { key: collectionName, ...entry } of schemaEntries) {
		schemaMapStr += `${JSON.stringify(collectionName)}: ${entry.value},\n`;
		schemaMapTypesStr += `${JSON.stringify(collectionName)}: ${entry.type},\n`;
	}

	generatedMaps = generatedMaps.replace('// GENERATED_CONTENT_MAP_ENTRIES', contentMapStr);
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
}

async function getContentMapEntries(
	collections: string[],
	{ contentDir }: Pick<Dirs, 'contentDir'>
): Promise<CollectionEntry[]> {
	return Promise.all(
		collections.map(async (collectionPath) => {
			const collectionName = getCollectionName(collectionPath, { contentDir });
			const entries = await getEntriesByCollection(collectionPath, { contentDir });
			return [collectionName, entries];
		})
	);
}

async function getEntriesByCollection(
	collectionPath: string,
	{ contentDir }: Pick<Dirs, 'contentDir'>
): Promise<Entry[]> {
	const files = await glob(`${collectionPath}/**/*.{md,mdx}`);
	return Promise.all(
		files.map(async (filePath) => {
			const entryKey = path.relative(collectionPath, filePath);
			const id = path.relative(contentDir.pathname, filePath);
			const slug = entryKey.replace(/\.mdx?$/, '');
			const body = await fs.readFile(filePath, 'utf-8');
			const { data, matter } = parseFrontmatter(body, filePath);
			return [entryKey, { id, slug, body, data, rawData: matter ?? '' }];
		})
	);
}

async function getSchemaMapEntries(
	collections: string[],
	{ contentDir }: Pick<Dirs, 'contentDir'>
): Promise<TypedMapEntry[]> {
	return Promise.all(
		collections.map(async (collectionPath) => {
			const collectionName = getCollectionName(collectionPath, { contentDir });
			const schemaFilePath = await getSchemaFilePath(collectionPath);
			const importStr = `import(${JSON.stringify(schemaFilePath)})`;
			return {
				key: collectionName,
				value: schemaFilePath ? importStr : `defaultSchemaFile(${JSON.stringify(collectionName)})`,
				type: schemaFilePath ? `typeof ${importStr}` : 'Promise<typeof defaultSchemaFileResolved>',
			};
		})
	);
}

async function getSchemaFilePath(collectionPath: string) {
	const schemaFilePath = `${collectionPath}/~schema`;
	const maybeSchemaFiles = await glob(`${schemaFilePath}.{js,mjs,ts}`);
	return maybeSchemaFiles.length ? schemaFilePath : undefined;
}

function getCollectionName(collectionPath: string, { contentDir }: Pick<Dirs, 'contentDir'>) {
	return path.relative(contentDir.pathname, collectionPath);
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
