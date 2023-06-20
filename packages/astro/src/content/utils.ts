import { slug as githubSlug } from 'github-slugger';
import matter from 'gray-matter';
import fsMod from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { PluginContext } from 'rollup';
import { normalizePath, type ViteDevServer } from 'vite';
import { z } from 'zod';
import type {
	AstroConfig,
	AstroSettings,
	ContentEntryType,
	DataEntryType,
	ImageInputFormat,
} from '../@types/astro.js';
import { VALID_INPUT_FORMATS } from '../assets/consts.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';

import { formatYAMLException, isYAMLException } from '../core/errors/utils.js';
import { CONTENT_FLAGS, CONTENT_TYPES_FILE } from './consts.js';
import { errorMap } from './error-map.js';
import { createImage } from './runtime-assets.js';

/**
 * Amap from a collection + slug to the local file path.
 * This is used internally to resolve entry imports when using `getEntry()`.
 * @see `content-module.template.mjs`
 */
export type ContentLookupMap = {
	[collectionName: string]: { type: 'content' | 'data'; entries: { [lookupId: string]: string } };
};

export const collectionConfigParser = z.union([
	z.object({
		type: z.literal('content').optional().default('content'),
		schema: z.any().optional(),
	}),
	z.object({
		type: z.literal('data'),
		schema: z.any().optional(),
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
	config: AstroConfig
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
		if (!config.experimental.assets) {
			throw new Error(
				'The function shape for schema can only be used when `experimental.assets` is enabled.'
			);
		}

		schema = schema({
			image: createImage(pluginContext, entry._internal.filePath),
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
						line: getYAMLErrorLine(entry._internal.rawData, String(parsed.error.errors[0].path[0])),
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

export function getEntryConfigByExtMap<TEntryType extends ContentEntryType | DataEntryType>(
	entryTypes: TEntryType[]
): Map<string, TEntryType> {
	const map = new Map<string, TEntryType>();
	for (const entryType of entryTypes) {
		for (const ext of entryType.extensions) {
			map.set(ext, entryType);
		}
	}
	return map;
}

export function getEntryCollectionName({
	contentDir,
	entry,
}: Pick<ContentPaths, 'contentDir'> & { entry: string | URL }) {
	const entryPath = typeof entry === 'string' ? entry : fileURLToPath(entry);
	const rawRelativePath = path.relative(fileURLToPath(contentDir), entryPath);
	const collectionName = path.dirname(rawRelativePath).split(path.sep)[0];
	const isOutsideCollection =
		!collectionName || collectionName === '' || collectionName === '..' || collectionName === '.';

	if (isOutsideCollection) {
		return undefined;
	}

	return collectionName;
}

export function getDataEntryId({
	entry,
	contentDir,
	collection,
}: Pick<ContentPaths, 'contentDir'> & { entry: URL; collection: string }): string {
	const relativePath = getRelativeEntryPath(entry, collection, contentDir);
	const withoutFileExt = relativePath.replace(new RegExp(path.extname(relativePath) + '$'), '');

	return withoutFileExt;
}

export function getContentEntryIdAndSlug({
	entry,
	contentDir,
	collection,
}: Pick<ContentPaths, 'contentDir'> & { entry: URL; collection: string }): {
	id: string;
	slug: string;
} {
	const relativePath = getRelativeEntryPath(entry, collection, contentDir);
	const withoutFileExt = relativePath.replace(new RegExp(path.extname(relativePath) + '$'), '');
	const rawSlugSegments = withoutFileExt.split(path.sep);

	const slug = rawSlugSegments
		// Slugify each route segment to handle capitalization and spaces.
		// Note: using `slug` instead of `new Slugger()` means no slug deduping.
		.map((segment) => githubSlug(segment))
		.join('/')
		.replace(/\/index$/, '');

	const res = {
		id: normalizePath(relativePath),
		slug,
	};
	return res;
}

function getRelativeEntryPath(entry: URL, collection: string, contentDir: URL) {
	const relativeToContent = path.relative(fileURLToPath(contentDir), fileURLToPath(entry));
	const relativeToCollection = path.relative(collection, relativeToContent);
	return relativeToCollection;
}

export function getEntryType(
	entryPath: string,
	paths: Pick<ContentPaths, 'config' | 'contentDir'>,
	contentFileExts: string[],
	dataFileExts: string[],
	// TODO: Unflag this when we're ready to release assets - erika, 2023-04-12
	experimentalAssets = false
): 'content' | 'data' | 'config' | 'ignored' | 'unsupported' {
	const { ext, base } = path.parse(entryPath);
	const fileUrl = pathToFileURL(entryPath);

	if (
		hasUnderscoreBelowContentDirectoryPath(fileUrl, paths.contentDir) ||
		isOnIgnoreList(base) ||
		(experimentalAssets && isImageAsset(ext))
	) {
		return 'ignored';
	} else if (contentFileExts.includes(ext)) {
		return 'content';
	} else if (dataFileExts.includes(ext)) {
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

export function hasUnderscoreBelowContentDirectoryPath(
	fileUrl: URL,
	contentDir: ContentPaths['contentDir']
): boolean {
	const parts = fileUrl.pathname.replace(contentDir.pathname, '').split('/');
	for (const part of parts) {
		if (part.startsWith('_')) return true;
	}
	return false;
}

function getYAMLErrorLine(rawData: string | undefined, objectKey: string) {
	if (!rawData) return 0;
	const indexOfObjectKey = rawData.search(
		// Match key either at the top of the file or after a newline
		// Ensures matching on top-level object keys only
		new RegExp(`(\n|^)${objectKey}`)
	);
	if (indexOfObjectKey === -1) return 0;

	const dataBeforeKey = rawData.substring(0, indexOfObjectKey + 1);
	const numNewlinesBeforeKey = dataBeforeKey.split('\n').length;
	return numNewlinesBeforeKey;
}

export function parseFrontmatter(fileContents: string) {
	try {
		// `matter` is empty string on cache results
		// clear cache to prevent this
		(matter as any).clearCache();
		return matter(fileContents);
	} catch (e) {
		if (isYAMLException(e)) {
			throw formatYAMLException(e);
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

export function hasContentFlag(viteId: string, flag: (typeof CONTENT_FLAGS)[number]): boolean {
	const flags = new URLSearchParams(viteId.split('?')[1] ?? '');
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
	const configPathname = fileURLToPath(contentPaths.config.url);
	unparsedConfig = await viteServer.ssrLoadModule(configPathname);

	const config = contentConfigParser.safeParse(unparsedConfig);
	if (config.success) {
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
	assetsDir: URL;
	cacheDir: URL;
	typesTemplate: URL;
	virtualModTemplate: URL;
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
	const pkgBase = new URL('../../', import.meta.url);
	return {
		cacheDir: new URL('.astro/', root),
		contentDir: new URL('./content/', srcDir),
		assetsDir: new URL('./assets/', srcDir),
		typesTemplate: new URL('content-types.template.d.ts', pkgBase),
		virtualModTemplate: new URL('content-module.template.mjs', pkgBase),
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
	let contents: string;
	try {
		contents = await fs.promises.readFile(fileUrl, 'utf-8');
	} catch (e) {
		// File contents should exist. Raise unexpected error as "unknown" if not.
		throw new AstroError(AstroErrorData.UnknownContentCollectionError, { cause: e });
	}
	const { slug: frontmatterSlug } = await contentEntryType.getEntryInfo({
		fileUrl,
		contents,
	});
	return parseEntrySlug({ generatedSlug, frontmatterSlug, id, collection });
}

export function getExtGlob(exts: string[]) {
	return exts.length === 1
		? // Wrapping {...} breaks when there is only one extension
		  exts[0]
		: `{${exts.join(',')}}`;
}
