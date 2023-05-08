import { slug as githubSlug } from 'github-slugger';
import matter from 'gray-matter';
import fsMod from 'node:fs';
import path from 'node:path';
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
import { CONTENT_TYPES_FILE } from './consts.js';
import { errorMap } from './error-map.js';
import { createImage } from './runtime-assets.js';

export const collectionConfigParser = z.object({
	schema: z.any().optional(),
});

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
export type EntryInfo = {
	id: string;
	slug: string;
	collection: string;
};

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
	entry: EntryInfo & { unvalidatedData: Record<string, unknown>; _internal: EntryInternal },
	collectionConfig: CollectionConfig,
	pluginContext: PluginContext,
	settings: AstroSettings
) {
	// Remove reserved `slug` field before parsing data
	let { slug, ...data } = entry.unvalidatedData;

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
		// Catch reserved `slug` field inside schema
		// Note: will not warn for `z.union` or `z.intersection` schemas
		if (typeof schema === 'object' && 'shape' in schema && schema.shape.slug) {
			throw new AstroError({
				...AstroErrorData.ContentSchemaContainsSlugError,
				message: AstroErrorData.ContentSchemaContainsSlugError.message(entry.collection),
			});
		}

		// Use `safeParseAsync` to allow async transforms
		const parsed = await schema.safeParseAsync(entry.unvalidatedData, {
			errorMap,
		});
		if (parsed.success) {
			data = parsed.data;
		} else {
			const formattedError = new AstroError({
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
			throw formattedError;
		}
	}
	return data;
}

export function getContentEntryExts(settings: Pick<AstroSettings, 'contentEntryTypes'>) {
	return settings.contentEntryTypes.map((t) => t.extensions).flat();
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

export class NoCollectionError extends Error {}

export function getEntryInfo(
	params: Pick<ContentPaths, 'contentDir'> & {
		entry: string | URL;
		allowFilesOutsideCollection?: true;
	}
): EntryInfo;
export function getEntryInfo({
	entry,
	contentDir,
	allowFilesOutsideCollection = false,
}: Pick<ContentPaths, 'contentDir'> & {
	entry: string | URL;
	allowFilesOutsideCollection?: boolean;
}): EntryInfo | NoCollectionError {
	const rawRelativePath = path.relative(
		fileURLToPath(contentDir),
		typeof entry === 'string' ? entry : fileURLToPath(entry)
	);
	const rawCollection = path.dirname(rawRelativePath).split(path.sep).shift();
	const isOutsideCollection = rawCollection === '..' || rawCollection === '.';

	if (!rawCollection || (!allowFilesOutsideCollection && isOutsideCollection))
		return new NoCollectionError();

	const rawId = path.relative(rawCollection, rawRelativePath);
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
		collection: normalizePath(rawCollection),
	};
	return res;
}

export function getEntryType(
	entryPath: string,
	paths: Pick<ContentPaths, 'config' | 'contentDir'>,
	contentFileExts: string[],
	// TODO: Unflag this when we're ready to release assets - erika, 2023-04-12
	experimentalAssets: boolean
): 'content' | 'config' | 'ignored' | 'unsupported' {
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
		return config.data;
	} else {
		return undefined;
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
