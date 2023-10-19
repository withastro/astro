import glob from 'fast-glob';
import fsMod from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pLimit from 'p-limit';
import type { Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { appendForwardSlash, removeFileExtension, removeLeadingForwardSlash, slash } from '../core/path.js';
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
}

export function astroContentVirtualModPlugin({
	settings,
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
					fs: fsMod,
				});
				const code = await generateContentEntryFile({ settings, fs: fsMod, lookupMap });

				return {
					code
				};
			}
		},
	};
}

const IS_DEV = process.env.NODE_ENV !== 'production';
// TODO: ugh this is not a nice abstraction. Come up with something better!
function getContentExtension(index: number) {
	if (IS_DEV) {
		if (index === 0) {
			return `?astroContentCollectionEntry`;
		}
		if (index === 1) {
			return `?astroDataCollectionEntry`
		}

		if (index === 2) {
			return `?astroRenderContent`
		}
	}

	if (index === 2) {
		return `.entry.mjs`
	}
}

export async function generateContentEntryFile({
	settings,
	fs,
	lookupMap,
}: {
	settings: AstroSettings;
	fs: typeof fsMod;
	lookupMap: ContentLookupMap
}) {
	const contentPaths = getContentPaths(settings.config);
	const relContentDir = rootRelativePath(settings.config.root, contentPaths.contentDir);

	const contentEntryConfigByExt = getEntryConfigByExtMap(settings.contentEntryTypes);
	const contentEntryExts = [...contentEntryConfigByExt.keys()];
	const dataEntryExts = getDataEntryExts(settings);

	const [contentEntryGlobResult, dataEntryGlobResult, renderEntryGlobResult] = await Promise.all([contentEntryExts, dataEntryExts, contentEntryExts].map((exts, i) => getStringifiedGlobResult(settings, exts, getContentExtension(i))));

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
	fs: typeof fsMod;
}) {
	const { root } = settings.config;
	const contentPaths = getContentPaths(settings.config);
	const relContentDir = rootRelativePath(root, contentPaths.contentDir, false);

	const contentEntryConfigByExt = getEntryConfigByExtMap(settings.contentEntryTypes);
	const dataEntryExts = getDataEntryExts(settings);

	const { contentDir } = contentPaths;
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

async function getStringifiedGlobResult(settings: AstroSettings, exts: string[], importExtension = '.mjs'): Promise<string> {
	const pattern = globWithUnderscoresIgnored('./', exts);
	const contentPaths = getContentPaths(settings.config);

	const files = await glob(pattern, {
		cwd: fileURLToPath(contentPaths.contentDir),
		fs: {
			readdir: fsMod.readdir.bind(fsMod),
			readdirSync: fsMod.readdirSync.bind(fsMod),
		},
		onlyFiles: true,
		objectMode: true,
	})

	let str = '{';
	// TODO: cleanup this dev vs prod difference! Relying on NODE_ENV is probably a bad idea?
	const prefix = IS_DEV ? contentPaths.contentDir.toString().replace(settings.config.root.toString(), '/') : './';
	const strip = IS_DEV ? (v: string) => v : removeFileExtension;
	for (const file of files) {
		const importSpecifier = `${prefix}${strip(removeLeadingForwardSlash(slash(file.path)))}${importExtension}`;
		const srcRelativePath = new URL(`./${slash(file.path)}`, contentPaths.contentDir).toString().replace(settings.config.root.toString(), '/')
		str += `\n  "${srcRelativePath}": () => import("${importSpecifier}"),`
	}
	str += '\n}'

	return str;
}

function globWithUnderscoresIgnored(relContentDir: string, exts: string[]): string[] {
	const extGlob = getExtGlob(exts);
	const contentDir = appendForwardSlash(relContentDir);
	return [
		`${contentDir}**/*${extGlob}`,
		`!${contentDir}**/_*/**/*${extGlob}`,
		`!${contentDir}**/_*${extGlob}`,
	];
}
