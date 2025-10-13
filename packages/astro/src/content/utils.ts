import fsMod from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { slug as githubSlug } from 'github-slugger';
import { green, red } from 'kleur/colors';
import type { PluginContext } from 'rollup';
import type { ViteDevServer } from 'vite';
import xxhash from 'xxhash-wasm';
import * as z3 from 'zod/v3';
import * as z4 from 'zod/v4';
import { AstroError, AstroErrorData, errorMap, MarkdownError } from '../core/errors/index.js';
import { isYAMLException } from '../core/errors/utils.js';
import type { Logger } from '../core/logger/core.js';
import { normalizePath } from '../core/viteUtils.js';
import type { AstroSettings } from '../types/astro.js';
import type { AstroConfig } from '../types/public/config.js';
import type { ContentEntryType, DataEntryType } from '../types/public/content.js';
import {
	type CONTENT_FLAGS,
	CONTENT_LAYER_TYPE,
	CONTENT_MODULE_FLAG,
	DEFERRED_MODULE,
	IMAGE_IMPORT_PREFIX,
	LIVE_CONTENT_TYPE,
	PROPAGATED_ASSET_FLAG,
} from './consts.js';
import { createImage } from './runtime-assets.js';

const entryTypeSchema = z3
	.object({
		id: z3.string({
			invalid_type_error: 'Content entry `id` must be a string',
			// Default to empty string so we can validate properly in the loader
		}),
	})
	.passthrough();

export const loaderReturnSchema = z3.union([
	z3.array(entryTypeSchema),
	z3.record(
		z3.string(),
		z3
			.object({
				id: z3
					.string({
						invalid_type_error: 'Content entry `id` must be a string',
					})
					.optional(),
			})
			.passthrough(),
	),
]);

const collectionConfigParser = z3.union([
	z3.object({
		type: z3.literal(CONTENT_LAYER_TYPE),
		schema: z3.any().optional(),
		loader: z3.union([
			z3.function(),
			z3.object({
				name: z3.string(),
				load: z3.function(
					z3.tuple(
						[
							z3.object({
								collection: z3.string(),
								store: z3.any(),
								meta: z3.any(),
								logger: z3.any(),
								config: z3.any(),
								entryTypes: z3.any(),
								parseData: z3.any(),
								renderMarkdown: z3.any(),
								generateDigest: z3.function(z3.tuple([z3.any()], z3.string())),
								watcher: z3.any().optional(),
								refreshContextData: z3.record(z3.unknown()).optional(),
							}),
						],
						z3.unknown(),
					),
				),
				schema: z3.any().optional(),
				render: z3.function(z3.tuple([z3.any()], z3.unknown())).optional(),
			}),
		]),
	}),
	z3.object({
		type: z3.literal(LIVE_CONTENT_TYPE).optional().default(LIVE_CONTENT_TYPE),
		schema: z3.any().optional(),
		loader: z3.function(),
	}),
]);

const contentConfigParser = z3.object({
	collections: z3.record(collectionConfigParser),
});

export type CollectionConfig = z3.infer<typeof collectionConfigParser>;
export type ContentConfig = z3.infer<typeof contentConfigParser> & { digest?: string };

type EntryInternal = { rawData: string | undefined; filePath: string };

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
		return z3.string().default(generatedSlug).parse(frontmatterSlug);
	} catch {
		throw new AstroError({
			...AstroErrorData.InvalidContentEntrySlugError,
			message: AstroErrorData.InvalidContentEntrySlugError.message(collection, id),
		});
	}
}

export async function getEntryDataAndImages<
	TInputData extends Record<string, unknown> = Record<string, unknown>,
	TOutputData extends TInputData = TInputData,
>(
	entry: {
		id: string;
		collection: string;
		unvalidatedData: TInputData;
		_internal: EntryInternal;
	},
	collectionConfig: CollectionConfig,
	shouldEmitFile: boolean,
	pluginContext?: PluginContext,
): Promise<{ data: TOutputData; imageImports: Array<string> }> {
	let data = entry.unvalidatedData as TOutputData;

	let schema = collectionConfig.schema;

	const imageImports = new Set<string>();

	if (typeof schema === 'function') {
		if (pluginContext) {
			schema = schema({
				image: createImage(pluginContext, shouldEmitFile, entry._internal.filePath),
			});
		} else if (collectionConfig.type === CONTENT_LAYER_TYPE) {
			const temp = schema({
				image: () => new Proxy({}, {}),
			});
			const isZod4 = '_zod' in temp;
			const transform = (val: string) => {
				imageImports.add(val);
				return `${IMAGE_IMPORT_PREFIX}${val}`;
			};
			schema = schema({
				image: isZod4
					? () => z4.string().transform(transform)
					: () => z3.string().transform(transform),
			});
		}
	}

	if (schema) {
		// Use `safeParseAsync` to allow async transforms
		let formattedError;
		const parsed = await (schema as z3.ZodSchema).safeParseAsync(data, {
			errorMap(error, ctx) {
				if (error.code === 'custom' && error.params?.isHoistedAstroError) {
					formattedError = error.params?.astroError;
				}
				return errorMap(error, ctx);
			},
		});
		if (parsed.success) {
			data = parsed.data as TOutputData;
		} else {
			if (!formattedError) {
				formattedError = new AstroError({
					...AstroErrorData.InvalidContentEntryDataError,
					message: AstroErrorData.InvalidContentEntryDataError.message(
						entry.collection,
						entry.id,
						parsed.error,
					),
					location: {
						file: entry._internal?.filePath,
						line: getYAMLErrorLine(
							entry._internal?.rawData,
							String(parsed.error.errors[0].path[0]),
						),
						column: 0,
					},
				});
			}
			throw formattedError;
		}
	}

	return { data, imageImports: Array.from(imageImports) };
}

export async function getEntryData(
	entry: {
		id: string;
		collection: string;
		unvalidatedData: Record<string, unknown>;
		_internal: EntryInternal;
	},
	collectionConfig: CollectionConfig,
	shouldEmitFile: boolean,
	pluginContext?: PluginContext,
) {
	const { data } = await getEntryDataAndImages(
		entry,
		collectionConfig,
		shouldEmitFile,
		pluginContext,
	);
	return data;
}

export function getContentEntryExts(settings: Pick<AstroSettings, 'contentEntryTypes'>) {
	return settings.contentEntryTypes.map((t) => t.extensions).flat();
}

export function getDataEntryExts(settings: Pick<AstroSettings, 'dataEntryTypes'>) {
	return settings.dataEntryTypes.map((t) => t.extensions).flat();
}

export function getEntryConfigByExtMap<TEntryType extends ContentEntryType | DataEntryType>(
	entryTypes: TEntryType[],
): Map<string, TEntryType> {
	const map = new Map<string, TEntryType>();
	for (const entryType of entryTypes) {
		for (const ext of entryType.extensions) {
			map.set(ext, entryType);
		}
	}
	return map;
}

export async function getSymlinkedContentCollections({
	contentDir,
	logger,
	fs,
}: {
	contentDir: URL;
	logger: Logger;
	fs: typeof fsMod;
}): Promise<Map<string, string>> {
	const contentPaths = new Map<string, string>();
	const contentDirPath = fileURLToPath(contentDir);
	try {
		if (!fs.existsSync(contentDirPath) || !fs.lstatSync(contentDirPath).isDirectory()) {
			return contentPaths;
		}
	} catch {
		// Ignore if there isn't a valid content directory
		return contentPaths;
	}
	try {
		const contentDirEntries = await fs.promises.readdir(contentDir, { withFileTypes: true });
		for (const entry of contentDirEntries) {
			if (entry.isSymbolicLink()) {
				const entryPath = path.join(contentDirPath, entry.name);
				const realPath = await fs.promises.realpath(entryPath);
				contentPaths.set(normalizePath(realPath), entry.name);
			}
		}
	} catch (e) {
		logger.warn('content', `Error when reading content directory "${contentDir}"`);
		logger.debug('content', e);
		// If there's an error, return an empty map
		return new Map<string, string>();
	}

	return contentPaths;
}

export function reverseSymlink({
	entry,
	symlinks,
	contentDir,
}: {
	entry: string | URL;
	contentDir: string | URL;
	symlinks?: Map<string, string>;
}): string {
	const entryPath = normalizePath(typeof entry === 'string' ? entry : fileURLToPath(entry));
	const contentDirPath = typeof contentDir === 'string' ? contentDir : fileURLToPath(contentDir);
	if (!symlinks || symlinks.size === 0) {
		return entryPath;
	}

	for (const [realPath, symlinkName] of symlinks) {
		if (entryPath.startsWith(realPath)) {
			return normalizePath(path.join(contentDirPath, symlinkName, entryPath.replace(realPath, '')));
		}
	}
	return entryPath;
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
	const withoutFileExt = normalizePath(relativePath).replace(
		new RegExp(path.extname(relativePath) + '$'),
		'',
	);

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

function isParentDirectory(parent: URL, child: URL) {
	const relative = path.relative(fileURLToPath(parent), fileURLToPath(child));
	return !relative.startsWith('..') && !path.isAbsolute(relative);
}

export function getEntryType(
	entryPath: string,
	paths: Pick<ContentPaths, 'config' | 'contentDir' | 'root'>,
	contentFileExts: string[],
	dataFileExts: string[],
): 'content' | 'data' | 'config' | 'ignored' {
	const { ext } = path.parse(entryPath);
	const fileUrl = pathToFileURL(entryPath);

	const dotAstroDir = new URL('./.astro/', paths.root);

	if (fileUrl.href === paths.config.url.href) {
		return 'config';
	} else if (hasUnderscoreBelowContentDirectoryPath(fileUrl, paths.contentDir)) {
		return 'ignored';
	} else if (isParentDirectory(dotAstroDir, fileUrl)) {
		return 'ignored';
	} else if (contentFileExts.includes(ext)) {
		return 'content';
	} else if (dataFileExts.includes(ext)) {
		return 'data';
	} else {
		return 'ignored';
	}
}

function hasUnderscoreBelowContentDirectoryPath(
	fileUrl: URL,
	contentDir: ContentPaths['contentDir'],
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
		new RegExp(`(\n|^)${objectKey}`),
	);
	if (indexOfObjectKey === -1) return 0;

	const dataBeforeKey = rawData.substring(0, indexOfObjectKey + 1);
	const numNewlinesBeforeKey = dataBeforeKey.split('\n').length;
	return numNewlinesBeforeKey;
}

export function safeParseFrontmatter(source: string, id?: string) {
	try {
		return parseFrontmatter(source, { frontmatter: 'empty-with-spaces' });
	} catch (err: any) {
		const markdownError = new MarkdownError({
			name: 'MarkdownError',
			message: err.message,
			stack: err.stack,
			location: id
				? {
						file: id,
					}
				: undefined,
		});

		if (isYAMLException(err)) {
			markdownError.setLocation({
				file: id,
				line: err.mark.line,
				column: err.mark.column,
			});

			markdownError.setMessage(err.reason);
		}

		throw markdownError;
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

export function isDeferredModule(viteId: string): boolean {
	const flags = new URLSearchParams(viteId.split('?')[1] ?? '');
	return flags.has(CONTENT_MODULE_FLAG);
}

async function loadContentConfig({
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
		// Generate a digest of the config file so we can invalidate the cache if it changes
		const hasher = await xxhash();
		const digest = await hasher.h64ToString(await fs.promises.readFile(configPathname, 'utf-8'));
		return { ...config.data, digest };
	} else {
		const message = config.error.issues
			.map((issue) => `  → ${green(issue.path.join('.'))}: ${red(issue.message)}`)
			.join('\n');
		console.error(
			`${green('[content]')} There was a problem with your content config:\n\n${message}\n`,
		);
		if (settings.config.experimental.liveContentCollections) {
			const liveCollections = Object.entries(unparsedConfig.collections ?? {}).filter(
				([, collection]: [string, any]) => collection?.type === LIVE_CONTENT_TYPE,
			);
			if (liveCollections.length > 0) {
				throw new AstroError({
					...AstroErrorData.LiveContentConfigError,
					message: AstroErrorData.LiveContentConfigError.message(
						'Live collections must be defined in a `src/live.config.ts` file.',
						path.relative(fileURLToPath(settings.config.root), configPathname),
					),
				});
			}
		}
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
		let config = await loadContentConfig(loadContentConfigOpts);

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

function contentObservable(initialCtx: ContentCtx): ContentObservable {
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
	root: URL;
	contentDir: URL;
	assetsDir: URL;
	typesTemplate: URL;
	virtualModTemplate: URL;
	config: {
		exists: boolean;
		url: URL;
	};
	liveConfig: {
		exists: boolean;
		url: URL;
	};
};

export function getContentPaths(
	{ srcDir, root, experimental }: Pick<AstroConfig, 'root' | 'srcDir' | 'experimental'>,
	fs: typeof fsMod = fsMod,
): ContentPaths {
	const configStats = searchConfig(fs, srcDir);

	if (!configStats.exists) {
		const legacyConfigStats = searchLegacyConfig(fs, srcDir);
		if (legacyConfigStats.exists) {
			const relativePath = path.relative(fileURLToPath(root), fileURLToPath(legacyConfigStats.url));
			throw new AstroError({
				...AstroErrorData.LegacyContentConfigError,
				message: AstroErrorData.LegacyContentConfigError.message(relativePath),
			});
		}
	}

	const liveConfigStats = experimental?.liveContentCollections
		? searchLiveConfig(fs, srcDir)
		: { exists: false, url: new URL('./', srcDir) };
	const pkgBase = new URL('../../', import.meta.url);
	return {
		root: new URL('./', root),
		contentDir: new URL('./content/', srcDir),
		assetsDir: new URL('./assets/', srcDir),
		typesTemplate: new URL('templates/content/types.d.ts', pkgBase),
		virtualModTemplate: new URL('templates/content/module.mjs', pkgBase),
		config: configStats,
		liveConfig: liveConfigStats,
	};
}

function searchConfig(fs: typeof fsMod, srcDir: URL): { exists: boolean; url: URL } {
	const paths = [
		'content.config.mjs',
		'content.config.js',
		'content.config.mts',
		'content.config.ts',
	];
	return search(fs, srcDir, paths);
}

function searchLegacyConfig(fs: typeof fsMod, srcDir: URL): { exists: boolean; url: URL } {
	const paths = [
		'content/config.ts',
		'content/config.js',
		'content/config.mjs',
		'content/config.mts',
	];
	return search(fs, srcDir, paths);
}

function searchLiveConfig(fs: typeof fsMod, srcDir: URL): { exists: boolean; url: URL } {
	const paths = ['live.config.mjs', 'live.config.js', 'live.config.mts', 'live.config.ts'];
	return search(fs, srcDir, paths);
}

function search(fs: typeof fsMod, srcDir: URL, paths: string[]): { exists: boolean; url: URL } {
	const urls = paths.map((p) => new URL(`./${p}`, srcDir));
	for (const file of urls) {
		if (fs.existsSync(file)) {
			return { exists: true, url: file };
		}
	}
	return { exists: false, url: urls[0] };
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

export function hasAssetPropagationFlag(id: string): boolean {
	try {
		return new URL(id, 'file://').searchParams.has(PROPAGATED_ASSET_FLAG);
	} catch {
		return false;
	}
}

/**
 * Convert a platform path to a posix path.
 */
function posixifyPath(filePath: string) {
	return filePath.split(path.sep).join('/');
}

/**
 * Unlike `path.posix.relative`, this function will accept a platform path and return a posix path.
 */
export function posixRelative(from: string, to: string) {
	return posixifyPath(path.relative(from, to));
}

export function contentModuleToId(fileName: string) {
	const params = new URLSearchParams(DEFERRED_MODULE);
	params.set('fileName', fileName);
	params.set(CONTENT_MODULE_FLAG, 'true');
	return `${DEFERRED_MODULE}?${params.toString()}`;
}

// Based on https://github.com/sindresorhus/safe-stringify
function safeStringifyReplacer(seen: WeakSet<object>) {
	return function (_key: string, value: unknown) {
		if (!(value !== null && typeof value === 'object')) {
			return value;
		}
		if (seen.has(value)) {
			return '[Circular]';
		}
		seen.add(value);
		const newValue = Array.isArray(value) ? [] : {};
		for (const [key2, value2] of Object.entries(value)) {
			(newValue as Record<string, unknown>)[key2] = safeStringifyReplacer(seen)(key2, value2);
		}
		seen.delete(value);
		return newValue;
	};
}
export function safeStringify(value: unknown) {
	const seen = new WeakSet();
	return JSON.stringify(value, safeStringifyReplacer(seen));
}
