import fsMod from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { slug as githubSlug } from 'github-slugger';
import colors from 'piccolore';
import xxhash from 'xxhash-wasm';
import * as z from 'zod/v4';
import { AstroError, AstroErrorData, errorMap, MarkdownError } from '../core/errors/index.js';
import { isYAMLException } from '../core/errors/utils.js';
import { appendForwardSlash } from '../core/path.js';
import { normalizePath } from '../core/viteUtils.js';
import {
	CONTENT_LAYER_TYPE,
	CONTENT_MODULE_FLAG,
	DEFERRED_MODULE,
	IMAGE_IMPORT_PREFIX,
	LIVE_CONTENT_TYPE,
} from './consts.js';
import { glob, secretLegacyFlag } from './loaders/glob.js';
import { createImage } from './runtime-assets.js';
const entryTypeSchema = z
	.object({
		id: z.string({
			error: 'Content entry `id` must be a string',
			// Default to empty string so we can validate properly in the loader
		}),
	})
	.passthrough();
const loaderReturnSchema = z.union([
	z.array(entryTypeSchema),
	z.record(
		z.string(),
		z
			.object({
				id: z
					.string({
						error: 'Content entry `id` must be a string',
					})
					.optional(),
			})
			.passthrough(),
	),
]);
const collectionConfigParser = z.union([
	z.object({
		type: z.literal('content').optional(),
		schema: z.any().optional(),
		loader: z.never().optional(),
	}),
	z.object({
		type: z.literal('data').optional(),
		schema: z.any().optional(),
		loader: z.never().optional(),
	}),
	z.object({
		type: z.literal(CONTENT_LAYER_TYPE),
		schema: z.any().optional(),
		loader: z.union([
			z.function(),
			z.object({
				name: z.string(),
				load: z.function({
					input: [z.custom()],
					output: z.custom(),
				}),
				schema: z
					.any()
					.transform((v) => {
						if (typeof v === 'function') {
							console.warn(
								`Your loader's schema is defined using a function. This is no longer supported and the schema will be ignored. Please update your loader to use the \`createSchema()\` utility instead, or report this to the loader author. In a future major version, this will cause the loader to break entirely.`,
							);
							return void 0;
						}
						return v;
					})
					.superRefine((v, ctx) => {
						if (v !== void 0 && !('_zod' in v)) {
							ctx.addIssue({
								code: z.ZodIssueCode.custom,
								message: 'Invalid Zod schema',
							});
							return z.NEVER;
						}
					})
					.optional(),
				createSchema: z
					.function({
						input: [],
						output: z.promise(
							z.object({
								schema: z.custom((v) => '_zod' in v),
								types: z.string(),
							}),
						),
					})
					.optional(),
			}),
		]),
	}),
	z.object({
		type: z.literal(LIVE_CONTENT_TYPE).optional().default(LIVE_CONTENT_TYPE),
		schema: z.any().optional(),
		loader: z.function(),
	}),
]);
const contentConfigParser = z.object({
	collections: z.record(z.string(), collectionConfigParser),
});
function parseEntrySlug({ id, collection, generatedSlug, frontmatterSlug }) {
	try {
		return z.string().default(generatedSlug).parse(frontmatterSlug);
	} catch {
		throw new AstroError({
			...AstroErrorData.InvalidContentEntrySlugError,
			message: AstroErrorData.InvalidContentEntrySlugError.message(collection, id),
		});
	}
}
async function getEntryData(entry, collectionConfig, shouldEmitFile, pluginContext) {
	let data = entry.unvalidatedData;
	let schema = collectionConfig.schema;
	if (typeof schema === 'function') {
		if (pluginContext) {
			schema = schema({
				image: createImage(pluginContext, shouldEmitFile, entry._internal.filePath),
			});
		} else if (collectionConfig.type === CONTENT_LAYER_TYPE) {
			schema = schema({
				image: () =>
					z.string().transform((val) => {
						let normalizedPath = val;
						const isUrl = val.includes('://');
						const isAbsolute = val.startsWith('/');
						const isRelative = val.startsWith('.');
						if (val && !isUrl && !isAbsolute && !isRelative) {
							const entryDir = path.dirname(entry._internal.filePath);
							const resolvedPath = path.resolve(entryDir, val);
							if (fsMod.existsSync(resolvedPath)) {
								normalizedPath = `./${val}`;
							}
						}
						return `${IMAGE_IMPORT_PREFIX}${normalizedPath}`;
					}),
			});
		}
	}
	if (schema) {
		let formattedError;
		const parsed = await schema.safeParseAsync(data, {
			error(issue) {
				if (issue.code === 'custom' && issue.params?.isHoistedAstroError) {
					formattedError = issue.params?.astroError;
				}
				return errorMap(issue);
			},
		});
		if (parsed.success) {
			data = parsed.data;
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
							String(parsed.error.issues[0].path[0]),
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
function getContentEntryExts(settings) {
	return settings.contentEntryTypes.flatMap((t) => t.extensions);
}
function getDataEntryExts(settings) {
	return settings.dataEntryTypes.flatMap((t) => t.extensions);
}
function getEntryConfigByExtMap(entryTypes) {
	const map = /* @__PURE__ */ new Map();
	for (const entryType of entryTypes) {
		for (const ext of entryType.extensions) {
			map.set(ext, entryType);
		}
	}
	return map;
}
async function getSymlinkedContentCollections({ contentDir, logger, fs }) {
	const contentPaths = /* @__PURE__ */ new Map();
	const contentDirPath = fileURLToPath(contentDir);
	try {
		if (!fs.existsSync(contentDirPath) || !fs.lstatSync(contentDirPath).isDirectory()) {
			return contentPaths;
		}
	} catch {
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
		return /* @__PURE__ */ new Map();
	}
	return contentPaths;
}
function reverseSymlink({ entry, symlinks, contentDir }) {
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
function getEntryCollectionName({ contentDir, entry }) {
	const entryPath = typeof entry === 'string' ? entry : fileURLToPath(entry);
	const rawRelativePath = path.relative(fileURLToPath(contentDir), entryPath);
	const collectionName = path.dirname(rawRelativePath).split(path.sep)[0];
	const isOutsideCollection =
		!collectionName || collectionName === '' || collectionName === '..' || collectionName === '.';
	if (isOutsideCollection) {
		return void 0;
	}
	return collectionName;
}
function getDataEntryId({ entry, contentDir, collection }) {
	const relativePath = getRelativeEntryPath(entry, collection, contentDir);
	const withoutFileExt = normalizePath(relativePath).replace(
		new RegExp(path.extname(relativePath) + '$'),
		'',
	);
	return withoutFileExt;
}
function getContentEntryIdAndSlug({ entry, contentDir, collection }) {
	const relativePath = getRelativeEntryPath(entry, collection, contentDir);
	const withoutFileExt = relativePath.replace(new RegExp(path.extname(relativePath) + '$'), '');
	const rawSlugSegments = withoutFileExt.split(path.sep);
	const slug = rawSlugSegments
		.map((segment) => githubSlug(segment))
		.join('/')
		.replace(/\/index$/, '');
	const res = {
		id: normalizePath(relativePath),
		slug,
	};
	return res;
}
function getRelativeEntryPath(entry, collection, contentDir) {
	const relativeToContent = path.relative(fileURLToPath(contentDir), fileURLToPath(entry));
	const relativeToCollection = path.relative(collection, relativeToContent);
	return relativeToCollection;
}
function isParentDirectory(parent, child) {
	const relative = path.relative(fileURLToPath(parent), fileURLToPath(child));
	return !relative.startsWith('..') && !path.isAbsolute(relative);
}
function getEntryType(entryPath, paths, contentFileExts, dataFileExts) {
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
function hasUnderscoreBelowContentDirectoryPath(fileUrl, contentDir) {
	const parts = fileUrl.pathname.replace(contentDir.pathname, '').split('/');
	for (const part of parts) {
		if (part.startsWith('_')) return true;
	}
	return false;
}
function getYAMLErrorLine(rawData, objectKey) {
	if (!rawData) return 0;
	const indexOfObjectKey = rawData.search(
		// Match key either at the top of the file or after a newline
		// Ensures matching on top-level object keys only
		new RegExp(`(
|^)${objectKey}`),
	);
	if (indexOfObjectKey === -1) return 0;
	const dataBeforeKey = rawData.substring(0, indexOfObjectKey + 1);
	const numNewlinesBeforeKey = dataBeforeKey.split('\n').length;
	return numNewlinesBeforeKey;
}
function safeParseFrontmatter(source, id) {
	try {
		return parseFrontmatter(source, { frontmatter: 'empty-with-spaces' });
	} catch (err) {
		const markdownError = new MarkdownError({
			name: 'MarkdownError',
			message: err.message,
			stack: err.stack,
			location: id
				? {
						file: id,
					}
				: void 0,
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
const globalContentConfigObserver = contentObservable({ status: 'init' });
function hasContentFlag(viteId, flag) {
	const flags = new URLSearchParams(viteId.split('?')[1] ?? '');
	return flags.has(flag);
}
function isDeferredModule(viteId) {
	const flags = new URLSearchParams(viteId.split('?')[1] ?? '');
	return flags.has(CONTENT_MODULE_FLAG);
}
async function loadContentConfig({ fs, settings, environment }) {
	const contentPaths = getContentPaths(
		settings.config,
		fs,
		settings.config.legacy?.collectionsBackwardsCompat,
	);
	if (!contentPaths.config.exists) {
		return void 0;
	}
	const configPathname = fileURLToPath(contentPaths.config.url);
	const unparsedConfig = await environment.runner.import(configPathname);
	const config = contentConfigParser.safeParse(unparsedConfig);
	if (config.success) {
		const hasher = await xxhash();
		const digest = hasher.h64ToString(await fs.promises.readFile(configPathname, 'utf-8'));
		return { ...config.data, digest };
	} else {
		const message = config.error.issues
			.map(
				(issue) => `  \u2192 ${colors.green(issue.path.join('.'))}: ${colors.red(issue.message)}`,
			)
			.join('\n');
		console.error(
			`${colors.green('[content]')} There was a problem with your content config:

${message}
`,
		);
		const liveCollections = Object.entries(unparsedConfig.collections ?? {}).filter(
			([, collection]) => collection?.type === LIVE_CONTENT_TYPE,
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
		return void 0;
	}
}
async function autogenerateCollections({ config, settings, fs }) {
	if (!config) {
		return config;
	}
	if (!settings.config.legacy?.collectionsBackwardsCompat) {
		return config;
	}
	const contentDir = new URL('./content/', settings.config.srcDir);
	const collections = config.collections ?? {};
	const contentExts = getContentEntryExts(settings);
	const dataExts = getDataEntryExts(settings);
	const contentPattern = globWithUnderscoresIgnored('', contentExts);
	const dataPattern = globWithUnderscoresIgnored('', dataExts);
	let usesContentLayer = false;
	for (const collectionName of Object.keys(collections)) {
		const collection = collections[collectionName];
		if (collection?.type === CONTENT_LAYER_TYPE || collection?.type === LIVE_CONTENT_TYPE) {
			usesContentLayer = true;
			continue;
		}
		const isDataCollection = collection?.type === 'data';
		const base = new URL(`${collectionName}/`, contentDir);
		collections[collectionName] = {
			...collection,
			type: CONTENT_LAYER_TYPE,
			loader: glob({
				base,
				pattern: isDataCollection ? dataPattern : contentPattern,
				[secretLegacyFlag]: true,
			}),
		};
	}
	if (!usesContentLayer && fs.existsSync(contentDir)) {
		const orphanedCollections = [];
		for (const entry of await fs.promises.readdir(contentDir, { withFileTypes: true })) {
			const collectionName = entry.name;
			if (['_', '.'].includes(collectionName.at(0) ?? '')) {
				continue;
			}
			if (entry.isDirectory() && !(collectionName in collections)) {
				orphanedCollections.push(collectionName);
				const base = new URL(`${collectionName}/`, contentDir);
				collections[collectionName] = {
					type: CONTENT_LAYER_TYPE,
					loader: glob({
						base,
						pattern: contentPattern,
						[secretLegacyFlag]: true,
					}),
				};
			}
		}
		if (orphanedCollections.length > 0) {
			console.warn(
				`
Auto-generating collections for folders in "src/content/" that are not defined as collections.
This is deprecated, so you should define these collections yourself in "src/content.config.ts".
The following collections have been auto-generated: ${orphanedCollections.map((name) => colors.green(name)).join(', ')}
`,
			);
		}
	}
	return { ...config, collections };
}
async function reloadContentConfigObserver({
	observer = globalContentConfigObserver,
	...loadContentConfigOpts
}) {
	observer.set({ status: 'loading' });
	try {
		let config = await loadContentConfig(loadContentConfigOpts);
		config = await autogenerateCollections({
			config,
			...loadContentConfigOpts,
		});
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
function contentObservable(initialCtx) {
	const subscribers = /* @__PURE__ */ new Set();
	let ctx = initialCtx;
	function get() {
		return ctx;
	}
	function set(_ctx) {
		ctx = _ctx;
		subscribers.forEach((fn) => fn(ctx));
	}
	function subscribe(fn) {
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
function getContentPaths({ srcDir, root }, fs = fsMod, legacyCollectionsBackwardsCompat = false) {
	const pkgBase = new URL('../../', import.meta.url);
	const configStats = searchConfig(fs, srcDir);
	if (!configStats.exists) {
		const legacyConfigStats = searchLegacyConfig(fs, srcDir);
		if (legacyConfigStats.exists) {
			if (!legacyCollectionsBackwardsCompat) {
				const relativePath = path.relative(
					fileURLToPath(root),
					fileURLToPath(legacyConfigStats.url),
				);
				throw new AstroError({
					...AstroErrorData.LegacyContentConfigError,
					message: AstroErrorData.LegacyContentConfigError.message(relativePath),
				});
			}
			return getContentPathsWithConfig(root, srcDir, pkgBase, legacyConfigStats, fs);
		}
	}
	const liveConfigStats = searchLiveConfig(fs, srcDir);
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
function getContentPathsWithConfig(root, srcDir, pkgBase, configStats, fs) {
	const liveConfigStats = searchLiveConfig(fs, srcDir);
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
function searchConfig(fs, srcDir) {
	const paths = [
		'content.config.mjs',
		'content.config.js',
		'content.config.mts',
		'content.config.ts',
	];
	return search(fs, srcDir, paths);
}
function searchLegacyConfig(fs, srcDir) {
	const paths = [
		'content/config.ts',
		'content/config.js',
		'content/config.mjs',
		'content/config.mts',
	];
	return search(fs, srcDir, paths);
}
function searchLiveConfig(fs, srcDir) {
	const paths = ['live.config.mjs', 'live.config.js', 'live.config.mts', 'live.config.ts'];
	return search(fs, srcDir, paths);
}
function search(fs, srcDir, paths) {
	const urls = paths.map((p) => new URL(`./${p}`, srcDir));
	for (const file of urls) {
		if (fs.existsSync(file)) {
			return { exists: true, url: file };
		}
	}
	return { exists: false, url: urls[0] };
}
async function getEntrySlug({ id, collection, generatedSlug, contentEntryType, fileUrl, fs }) {
	let contents;
	try {
		contents = await fs.promises.readFile(fileUrl, 'utf-8');
	} catch (e) {
		throw new AstroError(AstroErrorData.UnknownContentCollectionError, { cause: e });
	}
	const { slug: frontmatterSlug } = await contentEntryType.getEntryInfo({
		fileUrl,
		contents,
	});
	return parseEntrySlug({ generatedSlug, frontmatterSlug, id, collection });
}
function getExtGlob(exts) {
	return exts.length === 1
		? // Wrapping {...} breaks when there is only one extension
			exts[0]
		: `{${exts.join(',')}}`;
}
function globWithUnderscoresIgnored(relContentDir, exts) {
	const extGlob = getExtGlob(exts);
	const contentDir = relContentDir.length > 0 ? appendForwardSlash(relContentDir) : relContentDir;
	return [
		`${contentDir}**/*${extGlob}`,
		`!${contentDir}**/_*/**/*${extGlob}`,
		`!${contentDir}**/_*${extGlob}`,
	];
}
function posixifyPath(filePath) {
	return filePath.split(path.sep).join('/');
}
function posixRelative(from, to) {
	return posixifyPath(path.relative(from, to));
}
function contentModuleToId(fileName) {
	const params = new URLSearchParams(DEFERRED_MODULE);
	params.set('fileName', fileName);
	params.set(CONTENT_MODULE_FLAG, 'true');
	return `${DEFERRED_MODULE}?${params.toString()}`;
}
function safeStringifyReplacer(seen) {
	return function (_key, value) {
		if (!(value !== null && typeof value === 'object')) {
			return value;
		}
		if (seen.has(value)) {
			return '[Circular]';
		}
		seen.add(value);
		const newValue = Array.isArray(value) ? [] : {};
		for (const [key2, value2] of Object.entries(value)) {
			newValue[key2] = safeStringifyReplacer(seen)(key2, value2);
		}
		seen.delete(value);
		return newValue;
	};
}
function safeStringify(value) {
	const seen = /* @__PURE__ */ new WeakSet();
	return JSON.stringify(value, safeStringifyReplacer(seen));
}
export {
	contentModuleToId,
	getContentEntryExts,
	getContentEntryIdAndSlug,
	getContentPaths,
	getDataEntryExts,
	getDataEntryId,
	getEntryCollectionName,
	getEntryConfigByExtMap,
	getEntryData,
	getEntrySlug,
	getEntryType,
	getSymlinkedContentCollections,
	globalContentConfigObserver,
	hasContentFlag,
	isDeferredModule,
	loaderReturnSchema,
	parseEntrySlug,
	posixRelative,
	reloadContentConfigObserver,
	reverseSymlink,
	safeParseFrontmatter,
	safeStringify,
};
