import glob, { type Options as FastGlobOptions } from 'fast-glob';
import { slug as githubSlug } from 'github-slugger';
import matter from 'gray-matter';
import fsMod from 'node:fs';
import path, { extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { PluginContext } from 'rollup';
import { normalizePath, type ErrorPayload as ViteErrorPayload, type ViteDevServer } from 'vite';
import { z } from 'zod';
import type {
	AstroConfig,
	AstroSettings,
	ContentEntryType,
	ImageInputFormat,
} from '../@types/astro.js';
import { VALID_INPUT_FORMATS } from '../assets/consts.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { CONTENT_TYPES_FILE, CONTENT_FLAGS } from './consts.js';
import { errorMap } from './error-map.js';
import { createImage } from './runtime-assets.js';
import { rootRelativePath } from '../core/util.js';

export const collectionConfigParser = z.union([
	z.object({
		type: z.literal('content').optional().default('content'),
		schema: z.any().optional(),
		referenceKey: z.string(),
	}),
	z.object({
		type: z.literal('data'),
		schema: z.any().optional(),
		referenceKey: z.string(),
	}),
]);

export function getDotAstroTypeReference({ root, srcDir }: { root: URL; srcDir: URL }) {
	const { cacheDir } = getContentPaths({ root, srcDir });
	const contentTypesRelativeToSrcDir = normalizePath(
		path.relative(fileURLToPath(srcDir), fileURLToPath(new URL(CONTENT_TYPES_FILE, cacheDir)))
	);

	return `/// <reference path=${JSON.stringify(contentTypesRelativeToSrcDir)} />`;
}

export const contentConfigParser = z.object({
	collections: z.record(collectionConfigParser),
});

export type CollectionConfig = z.infer<typeof collectionConfigParser>;
export type ContentConfig = z.infer<typeof contentConfigParser>;

type EntryInternal = { rawData: string | undefined; filePath: string };

export const msg = {
	collectionConfigMissing: (collection: string) =>
		`${collection} does not have a config. We suggest adding one for type safety!`,
};

export function parseEntrySlug({
	id,
	collection,
	generatedSlug,
	frontmatterSlug,
}: {
	id: string;
	collection: string;
	generatedSlug: string;
	frontmatterSlug?: unknown;
}) {
	try {
		return z.string().default(generatedSlug).parse(frontmatterSlug);
	} catch {
		throw new AstroError({
			...AstroErrorData.InvalidContentEntrySlugError,
			message: AstroErrorData.InvalidContentEntrySlugError.message(collection, id),
		});
	}
}

export async function getEntryData(
	entry: {
		id: string;
		collection: string;
		unvalidatedData: Record<string, unknown>;
		_internal: EntryInternal;
	},
	collectionConfig: CollectionConfig,
	pluginContext: PluginContext,
	settings: Pick<AstroSettings, 'config'>
) {
	let data;
	if (collectionConfig.type === 'data') {
		data = entry.unvalidatedData;
	} else {
		const { slug, ...unvalidatedData } = entry.unvalidatedData;
		data = unvalidatedData;
	}

	let schema = collectionConfig.schema;
	if (typeof schema === 'function') {
		if (!settings.config.experimental.assets) {
			throw new Error(
				'The function shape for schema can only be used when `experimental.assets` is enabled.'
			);
		}

		schema = schema({
			image: createImage(settings, pluginContext, entry._internal.filePath),
		});
	}

	if (schema) {
		// Catch reserved `slug` field inside content schemas
		// Note: will not warn for `z.union` or `z.intersection` schemas
		if (
			collectionConfig.type === 'content' &&
			typeof schema === 'object' &&
			'shape' in schema &&
			schema.shape.slug
		) {
			throw new AstroError({
				...AstroErrorData.ContentSchemaContainsSlugError,
				message: AstroErrorData.ContentSchemaContainsSlugError.message(entry.collection),
			});
		}

		// Use `safeParseAsync` to allow async transforms
		let formattedError;
		const parsed = await (schema as z.ZodSchema).safeParseAsync(entry.unvalidatedData, {
			errorMap(error, ctx) {
				if (error.code === 'custom' && error.params?.isHoistedAstroError) {
					formattedError = error.params?.astroError;
				}
				return errorMap(error, ctx);
			},
		});
		if (parsed.success) {
			data = parsed.data;
		} else {
			if (!formattedError) {
				formattedError = new AstroError({
					...AstroErrorData.InvalidContentEntryFrontmatterError,
					message: AstroErrorData.InvalidContentEntryFrontmatterError.message(
						entry.collection,
						entry.id,
						parsed.error
					),
					location: {
						file: entry._internal.filePath,
						line: getFrontmatterErrorLine(
							entry._internal.rawData,
							String(parsed.error.errors[0].path[0])
						),
						column: 0,
					},
				});
			}
			throw formattedError;
		}
	}
	return data;
}

export function getContentEntryExts(settings: Pick<AstroSettings, 'contentEntryTypes'>) {
	return settings.contentEntryTypes.map((t) => t.extensions).flat();
}

export function getDataEntryExts(settings: Pick<AstroSettings, 'dataEntryTypes'>) {
	return settings.dataEntryTypes.map((t) => t.extensions).flat();
}

export function getContentEntryConfigByExtMap(settings: Pick<AstroSettings, 'contentEntryTypes'>) {
	const map: Map<string, ContentEntryType> = new Map();
	for (const entryType of settings.contentEntryTypes) {
		for (const ext of entryType.extensions) {
			map.set(ext, entryType);
		}
	}
	return map;
}

export function getEntryCollectionName({ dir, entry }: { dir: URL; entry: string | URL }) {
	const entryPath = typeof entry === 'string' ? entry : fileURLToPath(entry);
	const rawRelativePath = path.relative(fileURLToPath(dir), entryPath);
	const collectionName = path.dirname(rawRelativePath).split(path.sep).shift() ?? '';
	const isOutsideCollection =
		collectionName === '' || collectionName === '..' || collectionName === '.';

	if (isOutsideCollection) {
		return undefined;
	}

	return collectionName;
}

export function getDataEntryId({
	entry,
	dataDir,
	collection,
}: {
	dataDir: URL;
	entry: URL;
	collection: string;
}): string {
	const rawRelativePath = path.relative(fileURLToPath(dataDir), fileURLToPath(entry));
	const rawId = path.relative(collection, rawRelativePath);
	const rawIdWithoutFileExt = rawId.replace(new RegExp(path.extname(rawId) + '$'), '');

	return rawIdWithoutFileExt;
}

export function getContentEntryIdAndSlug({
	entry,
	contentDir,
	collection,
}: {
	contentDir: URL;
	entry: URL;
	collection: string;
}): {
	id: string;
	slug: string;
} {
	const rawRelativePath = path.relative(fileURLToPath(contentDir), fileURLToPath(entry));
	const rawId = path.relative(collection, rawRelativePath);
	const rawIdWithoutFileExt = rawId.replace(new RegExp(path.extname(rawId) + '$'), '');
	const rawSlugSegments = rawIdWithoutFileExt.split(path.sep);

	const slug = rawSlugSegments
		// Slugify each route segment to handle capitalization and spaces.
		// Note: using `slug` instead of `new Slugger()` means no slug deduping.
		.map((segment) => githubSlug(segment))
		.join('/')
		.replace(/\/index$/, '');

	const res = {
		id: normalizePath(rawId),
		slug,
	};
	return res;
}

export function getEntryType(
	entryPath: string,
	paths: Pick<ContentPaths, 'config' | 'contentDir' | 'dataDir'>,
	contentFileExts: string[],
	dataFileExts: string[],
	collectionDir?: 'content' | 'data',
	// TODO: Unflag this when we're ready to release assets - erika, 2023-04-12
	experimentalAssets = false
): 'content' | 'data' | 'config' | 'ignored' | 'unsupported' {
	const { ext, base } = path.parse(entryPath);
	const fileUrl = pathToFileURL(entryPath);

	if (
		(experimentalAssets && isImageAsset(ext)) ||
		(collectionDir &&
			(hasUnderscoreBelowDirectoryPath(
				fileUrl,
				collectionDir === 'content' ? paths.contentDir : paths.dataDir
			) ||
				isOnIgnoreList(base)))
	) {
		return 'ignored';
	} else if (contentFileExts.includes(ext) && collectionDir === 'content') {
		return 'content';
	} else if (dataFileExts.includes(ext) && collectionDir === 'data') {
		return 'data';
	} else if (fileUrl.href === paths.config.url.href) {
		return 'config';
	} else {
		return 'unsupported';
	}
}

function isOnIgnoreList(fileName: string) {
	return ['.DS_Store'].includes(fileName);
}

/**
 * Return if a file extension is a valid image asset, so we can avoid outputting a warning for them.
 */
function isImageAsset(fileExt: string) {
	return VALID_INPUT_FORMATS.includes(fileExt.slice(1) as ImageInputFormat);
}

function hasUnderscoreBelowDirectoryPath(fileUrl: URL, dir: URL): boolean {
	const parts = fileUrl.pathname.replace(dir.pathname, '').split('/');
	for (const part of parts) {
		if (part.startsWith('_')) return true;
	}
	return false;
}

function getFrontmatterErrorLine(rawFrontmatter: string | undefined, frontmatterKey: string) {
	if (!rawFrontmatter) return 0;
	const indexOfFrontmatterKey = rawFrontmatter.indexOf(`\n${frontmatterKey}`);
	if (indexOfFrontmatterKey === -1) return 0;

	const frontmatterBeforeKey = rawFrontmatter.substring(0, indexOfFrontmatterKey + 1);
	const numNewlinesBeforeKey = frontmatterBeforeKey.split('\n').length;
	return numNewlinesBeforeKey;
}

/**
 * Match YAML exception handling from Astro core errors
 * @see 'astro/src/core/errors.ts'
 */
export function parseFrontmatter(fileContents: string, filePath: string) {
	try {
		// `matter` is empty string on cache results
		// clear cache to prevent this
		(matter as any).clearCache();
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

/**
 * The content config is loaded separately from other `src/` files.
 * This global observable lets dependent plugins (like the content flag plugin)
 * subscribe to changes during dev server updates.
 */
export const globalContentConfigObserver = contentObservable({ status: 'init' });

// TODO: hoist to proper error
const InvalidDataCollectionConfigError = {
	...AstroErrorData.UnknownContentCollectionError,
	message: (dataExtsStringified: string, collection: string) =>
		`Found a non-data collection with ${dataExtsStringified} files: **${collection}.** To make this a data collection, 1) move to \`src/data/\`, and 2) use the \`defineDataCollection()\` helper or add \`type: 'data'\` to your collection config.`,
};

export function hasContentFlag(viteId: string, flag: (typeof CONTENT_FLAGS)[number]) {
	const flags = new URLSearchParams(viteId.split('?')[1]);
	return flags.has(flag);
}

export async function loadContentConfig({
	fs,
	settings,
	viteServer,
}: {
	fs: typeof fsMod;
	settings: AstroSettings;
	viteServer: ViteDevServer;
}): Promise<ContentConfig | undefined> {
	const contentPaths = getContentPaths(settings.config, fs);
	let unparsedConfig;
	if (!contentPaths.config.exists) {
		return undefined;
	}
	try {
		const configPathname = fileURLToPath(contentPaths.config.url);
		unparsedConfig = await viteServer.ssrLoadModule(configPathname);
	} catch (e) {
		throw e;
	}
	const config = contentConfigParser.safeParse(unparsedConfig);
	if (config.success) {
		let collectionNameByReferenceKey: Record<string, string> = {};
		for (const [collectionName, collection] of Object.entries(config.data.collections)) {
			collectionNameByReferenceKey[collection.referenceKey] = collectionName;
		}

		// We need a way to map collection config references *back* to their collection name.
		// This generates a JSON map we can import when querying.
		await fs.promises.writeFile(
			new URL('reference-map.json', contentPaths.cacheDir),
			JSON.stringify(collectionNameByReferenceKey)
		);

		// Check that data collections are properly configured using `defineDataCollection()`.
		const dataEntryExts = getDataEntryExts(settings);

		const contentCollectionGlob = await glob('**', {
			cwd: fileURLToPath(contentPaths.contentDir),
			absolute: true,
			fs: {
				readdir: fs.readdir.bind(fs),
				readdirSync: fs.readdirSync.bind(fs),
			},
		});

		for (const entry of contentCollectionGlob) {
			const collectionName = getEntryCollectionName({ dir: contentPaths.contentDir, entry });
			if (!collectionName || !config.data.collections[collectionName]) continue;

			const { type } = config.data.collections[collectionName];
			if (type === 'content' && dataEntryExts.includes(path.extname(entry))) {
				throw new AstroError({
					...InvalidDataCollectionConfigError,
					message: InvalidDataCollectionConfigError.message(
						JSON.stringify(dataEntryExts.join(', ')),
						collectionName
					),
				});
			}
		}

		return config.data;
	} else {
		return undefined;
	}
}

export async function reloadContentConfigObserver({
	observer = globalContentConfigObserver,
	...loadContentConfigOpts
}: {
	fs: typeof fsMod;
	settings: AstroSettings;
	viteServer: ViteDevServer;
	observer?: ContentObservable;
}) {
	observer.set({ status: 'loading' });
	try {
		const config = await loadContentConfig(loadContentConfigOpts);
		if (config) {
			observer.set({ status: 'loaded', config });
		} else {
			observer.set({ status: 'does-not-exist' });
		}
	} catch (e) {
		observer.set({
			status: 'error',
			error: e instanceof Error ? e : new AstroError(AstroErrorData.UnknownContentCollectionError),
		});
	}
}

export function getCollectionDirByUrl(
	url: URL,
	contentPaths: Pick<ContentPaths, 'contentDir' | 'dataDir'>
): 'content' | 'data' | undefined {
	if (url.href.startsWith(contentPaths.contentDir.href)) {
		return 'content';
	} else if (url.href.startsWith(contentPaths.dataDir.href)) {
		return 'data';
	}
	return undefined;
}

type ContentCtx =
	| { status: 'init' }
	| { status: 'loading' }
	| { status: 'does-not-exist' }
	| { status: 'loaded'; config: ContentConfig }
	| { status: 'error'; error: Error };

type Observable<C> = {
	get: () => C;
	set: (ctx: C) => void;
	subscribe: (fn: (ctx: C) => void) => () => void;
};

export type ContentObservable = Observable<ContentCtx>;

export function contentObservable(initialCtx: ContentCtx): ContentObservable {
	type Subscriber = (ctx: ContentCtx) => void;
	const subscribers = new Set<Subscriber>();
	let ctx = initialCtx;
	function get() {
		return ctx;
	}
	function set(_ctx: ContentCtx) {
		ctx = _ctx;
		subscribers.forEach((fn) => fn(ctx));
	}
	function subscribe(fn: Subscriber) {
		subscribers.add(fn);
		return () => {
			subscribers.delete(fn);
		};
	}
	return {
		get,
		set,
		subscribe,
	};
}

export type ContentPaths = {
	contentDir: URL;
	dataDir: URL;
	assetsDir: URL;
	cacheDir: URL;
	typesTemplate: URL;
	virtualModTemplate: URL;
	virtualAssetsModTemplate: URL;
	config: {
		exists: boolean;
		url: URL;
	};
};

export function getContentPaths(
	{ srcDir, root }: Pick<AstroConfig, 'root' | 'srcDir'>,
	fs: typeof fsMod = fsMod
): ContentPaths {
	const configStats = search(fs, srcDir);
	const templateDir = new URL('../../src/content/template/', import.meta.url);
	return {
		cacheDir: new URL('.astro/', root),
		contentDir: new URL('./content/', srcDir),
		dataDir: new URL('./data/', srcDir),
		assetsDir: new URL('./assets/', srcDir),
		typesTemplate: new URL('types.d.ts', templateDir),
		virtualModTemplate: new URL('virtual-mod.mjs', templateDir),
		virtualAssetsModTemplate: new URL('virtual-mod-assets.mjs', templateDir),
		config: configStats,
	};
}
function search(fs: typeof fsMod, srcDir: URL) {
	const paths = ['config.mjs', 'config.js', 'config.ts'].map(
		(p) => new URL(`./content/${p}`, srcDir)
	);
	for (const file of paths) {
		if (fs.existsSync(file)) {
			return { exists: true, url: file };
		}
	}
	return { exists: false, url: paths[0] };
}

export async function getStringifiedLookupMap({
	contentPaths,
	contentEntryConfigByExt,
	root,
	fs,
}: {
	contentEntryConfigByExt: ReturnType<typeof getContentEntryConfigByExtMap>;
	contentPaths: Pick<ContentPaths, 'contentDir' | 'cacheDir'>;
	root: URL;
	fs: typeof fsMod;
}) {
	const { contentDir } = contentPaths;
	const globOpts: FastGlobOptions = {
		absolute: true,
		cwd: fileURLToPath(root),
		fs: {
			readdir: fs.readdir.bind(fs),
			readdirSync: fs.readdirSync.bind(fs),
		},
	};

	const relContentDir = rootRelativePath(root, contentDir, false);
	const contentGlob = await glob(
		`${relContentDir}**/*${getExtGlob([...contentEntryConfigByExt.keys()])}`,
		globOpts
	);
	let filePathByLookupId: {
		[collection: string]: Record<string, string>;
	} = {};

	await Promise.all(
		contentGlob.map(async (filePath) => {
			const contentEntryType = contentEntryConfigByExt.get(extname(filePath));
			if (!contentEntryType) return;
			const collection = getEntryCollectionName({
				dir: contentDir,
				entry: pathToFileURL(filePath),
			});
			if (!collection) return;

			const { id, slug: generatedSlug } = await getContentEntryIdAndSlug({
				entry: pathToFileURL(filePath),
				contentDir,
				collection,
			});
			filePathByLookupId[collection] ??= {};
			const slug = await getEntrySlug({
				id,
				collection,
				generatedSlug,
				fs,
				fileUrl: pathToFileURL(filePath),
				contentEntryType,
			});
			filePathByLookupId[collection][slug] = rootRelativePath(root, filePath);
		})
	);

	return JSON.stringify(filePathByLookupId);
}

/**
 * Check for slug in content entry frontmatter and validate the type,
 * falling back to the `generatedSlug` if none is found.
 */
export async function getEntrySlug({
	id,
	collection,
	generatedSlug,
	contentEntryType,
	fileUrl,
	fs,
}: {
	fs: typeof fsMod;
	id: string;
	collection: string;
	generatedSlug: string;
	fileUrl: URL;
	contentEntryType: Pick<ContentEntryType, 'getEntryInfo'>;
}) {
	const { slug: frontmatterSlug } = await contentEntryType.getEntryInfo({
		fileUrl,
		contents: await fs.promises.readFile(fileUrl, 'utf-8'),
	});
	return parseEntrySlug({ generatedSlug, frontmatterSlug, id, collection });
}

export function getExtGlob(exts: string[]) {
	return exts.length === 1
		? // Wrapping {...} breaks when there is only one extension
		  exts[0]
		: `{${exts.join(',')}}`;
}
