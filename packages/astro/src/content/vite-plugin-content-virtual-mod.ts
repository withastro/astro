import glob from 'fast-glob';
import nodeFs from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pLimit from 'p-limit';
import { transformWithEsbuild, type Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { removeFileExtension } from '../core/path.js';
import { rootRelativePath } from '../core/util.js';
import { VIRTUAL_MODULE_ID } from './consts.js';
import {
	getContentEntryIdAndSlug,
	getContentPaths,
	getDataEntryExts,
	getDataEntryId,
	getEntryCollectionName,
	getEntryConfigByExtMap,
	getEntrySlug,
	getEntryType,
	getExtGlob,
	type ContentLookupMap,
} from './utils.js';

interface AstroContentVirtualModPluginParams {
	settings: AstroSettings;
	fs: typeof nodeFs
}

export function astroContentVirtualModPlugin({
	settings,
	fs,
}: AstroContentVirtualModPluginParams): Plugin {
	const astroContentVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

	return {
		name: 'astro-content-virtual-mod-plugin',
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return astroContentVirtualModuleId;
			}
		},
		async load(id) {
			if (id === astroContentVirtualModuleId) {
				const lookupMap = await generateLookupMap({
					settings,
					fs,
				});
				const code = await generateContentEntryFile({ settings, fs, lookupMap });

				return {
					code
				};
			}
		},
	};
}

const IS_DEV = process.env.NODE_ENV !== 'production';

export async function generateContentEntryFile({
	settings,
	fs,
	lookupMap,
}: {
	settings: AstroSettings;
	fs: typeof nodeFs;
	lookupMap: ContentLookupMap
}) {
	const contentPaths = getContentPaths(settings.config);
	const relContentDir = rootRelativePath(settings.config.root, contentPaths.contentDir);

	// const contentEntryConfigByExt = getEntryConfigByExtMap(settings.contentEntryTypes);
	// const contentEntryExts = [...contentEntryConfigByExt.keys()];
	// const dataEntryExts = getDataEntryExts(settings);

	const contentEntryGlobResult = getStringifiedCollectionFromLookup('content', relContentDir, lookupMap);
	const dataEntryGlobResult = getStringifiedCollectionFromLookup('data', relContentDir, lookupMap);
	const renderEntryGlobResult = getStringifiedCollectionFromLookup('render', relContentDir, lookupMap);

	// const [contentEntryGlobResult, dataEntryGlobResult, renderEntryGlobResult] = await Promise.all([contentEntryExts, dataEntryExts, contentEntryExts].map((exts, i) => getStringifiedGlobResult(settings, exts, lookupMap, getContentExtension(i))));

	const virtualModContents = fs
		.readFileSync(contentPaths.virtualModTemplate, 'utf-8')
		.replace('@@CONTENT_DIR@@', relContentDir)
		.replace(
			"'@@CONTENT_ENTRY_GLOB_PATH@@'",
			contentEntryGlobResult
		)
		.replace(
			"'@@DATA_ENTRY_GLOB_PATH@@'",
			dataEntryGlobResult
		)
		.replace(
			"'@@RENDER_ENTRY_GLOB_PATH@@'",
			renderEntryGlobResult
		).replace(
			'/* @@LOOKUP_MAP_ASSIGNMENT@@ */',
			`lookupMap = ${JSON.stringify(lookupMap)};`
		);

	return virtualModContents;
}

function getStringifiedCollectionFromLookup(wantedType: 'content' | 'data' | 'render', relContentDir: string, lookupMap: ContentLookupMap) {
	let str = '{';
	// TODO: cleanup this dev vs prod difference! Relying on NODE_ENV is probably a bad idea?
	const prefix = IS_DEV ? '/' : './';
	const suffix = IS_DEV ? '' : wantedType === 'render' ? '.entry.mjs' : '.mjs';
	const strip = IS_DEV ? (v: string) => v : (v: string) => `${removeFileExtension(v)}${suffix}`;
	for (const { type, entries } of Object.values(lookupMap)) {
		if (type === wantedType || wantedType === 'render' && type === 'content') {
			for (const slug of Object.values(entries)) {
				str += `\n  "${slug}": () => import("${strip(slug.replace(relContentDir, prefix))}"),`
			}
		}
	}
	str += '\n}'
	return str;
}

/**
 * Generate a map from a collection + slug to the local file path.
 * This is used internally to resolve entry imports when using `getEntry()`.
 * @see `content-module.template.mjs`
 */
export async function generateLookupMap({
	settings,
	fs,
}: {
	settings: AstroSettings;
	fs: typeof nodeFs;
}) {
	const { root } = settings.config;
	const contentPaths = getContentPaths(settings.config);
	if (!contentPaths.config.exists) return {};
	const relContentDir = rootRelativePath(root, contentPaths.contentDir, false);

	const contentEntryConfigByExt = getEntryConfigByExtMap(settings.contentEntryTypes);
	const dataEntryExts = getDataEntryExts(settings);

	const { contentDir } = contentPaths;
	
	// TODO: this is a hack to avoid loading the actual config file. Is there a better way?
	const possibleConfigFiles = await glob("config.*", { absolute: true, cwd: fileURLToPath(contentPaths.contentDir), fs })
	const [filename] = possibleConfigFiles;
	const { code: configCode } = await transformWithEsbuild(fs.readFileSync(filename, { encoding: 'utf8' }), filename);

	const contentEntryExts = [...contentEntryConfigByExt.keys()];

	let lookupMap: ContentLookupMap = {};
	const contentGlob = await glob(
		`${relContentDir}**/*${getExtGlob([...dataEntryExts, ...contentEntryExts])}`,
		{
			absolute: true,
			cwd: fileURLToPath(root),
			fs: {
				readdir: fs.readdir.bind(fs),
				readdirSync: fs.readdirSync.bind(fs),
			},
		}
	)
	

	// Run 10 at a time to prevent `await getEntrySlug` from accessing the filesystem all at once.
	// Each await shouldn't take too long for the work to be noticably slow too.
	const limit = pLimit(10);
	const promises: Promise<void>[] = [];

	for (const filePath of contentGlob) {
		promises.push(
			limit(async () => {
				const entryType = getEntryType(filePath, contentPaths, contentEntryExts, dataEntryExts);
				// Globbed ignored or unsupported entry.
				// Logs warning during type generation, should ignore in lookup map.
				if (entryType !== 'content' && entryType !== 'data') return;

				const collection = getEntryCollectionName({ contentDir, entry: pathToFileURL(filePath) });
				if (!collection) throw UnexpectedLookupMapError;
				// TODO: Extremely naive lookup that collection name is referenced in the config
				// This could fail for any number of reasons.
				if (!configCode.includes(collection)) {
					return;
				}

				if (lookupMap[collection]?.type && lookupMap[collection].type !== entryType) {
					throw new AstroError({
						...AstroErrorData.MixedContentDataCollectionError,
						message: AstroErrorData.MixedContentDataCollectionError.message(collection),
					});
				}

				if (entryType === 'content') {
					const contentEntryType = contentEntryConfigByExt.get(extname(filePath));
					if (!contentEntryType) throw UnexpectedLookupMapError;

					const { id, slug: generatedSlug } = await getContentEntryIdAndSlug({
						entry: pathToFileURL(filePath),
						contentDir,
						collection,
					});
					const slug = await getEntrySlug({
						id,
						collection,
						generatedSlug,
						fs,
						fileUrl: pathToFileURL(filePath),
						contentEntryType,
					});
					if (lookupMap[collection]?.entries?.[slug]) {
						throw new AstroError({
							...AstroErrorData.DuplicateContentEntrySlugError,
							message: AstroErrorData.DuplicateContentEntrySlugError.message(collection, slug),
							hint:
								slug !== generatedSlug
									? `Check the \`slug\` frontmatter property in **${id}**.`
									: undefined,
						});
					}
					lookupMap[collection] = {
						type: 'content',
						entries: {
							...lookupMap[collection]?.entries,
							[slug]: rootRelativePath(root, filePath),
						},
					};
				} else {
					const id = getDataEntryId({ entry: pathToFileURL(filePath), contentDir, collection });
					lookupMap[collection] = {
						type: 'data',
						entries: {
							...lookupMap[collection]?.entries,
							[id]: rootRelativePath(root, filePath),
						},
					};
				}
			})
		);
	}

	await Promise.all(promises);
	return lookupMap;
}

const UnexpectedLookupMapError = new AstroError({
	...AstroErrorData.UnknownContentCollectionError,
	message: `Unexpected error while parsing content entry IDs and slugs.`,
});
