import glob from 'fast-glob';
import fsMod from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pLimit from 'p-limit';
import type { Plugin } from 'vite';
import type { AstroSettings, ContentEntryType } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { appendForwardSlash } from '../core/path.js';
import {
	resolveAstroPackageDirectory,
	resolveDotAstroDirectory,
	rootRelativePath,
} from '../core/util.js';
import { VIRTUAL_MODULE_ID } from './consts.js';
import {
	getContentEntryIdAndSlug,
	getDataEntryExtensions,
	getDataEntryId,
	getEntryCollectionName,
	getEntryConfigByExtensionMap,
	getEntrySlug,
	getEntryType,
	getExtGlob,
	type ContentLookupMap,
	resolveContentDirectory,
	findContentConfigFile,
} from './utils.js';

interface AstroContentVirtualModPluginParams {
	settings: AstroSettings;
}

export function astroContentVirtualModPlugin({
	settings,
}: AstroContentVirtualModPluginParams): Plugin {
	const contentDirectory = resolveContentDirectory(settings.config);
	const dotAstroDirectory = resolveDotAstroDirectory(settings.config);
	const contentConfigStats = findContentConfigFile(fsMod, settings.config);
	const virtualModuleTemplate = new URL(
		'content-module.template.mjs',
		resolveAstroPackageDirectory()
	);

	const relContentDir = rootRelativePath(settings.config.root, contentDirectory);

	const contentEntryConfigByExtension = getEntryConfigByExtensionMap(settings.contentEntryTypes);
	const contentEntryExtensions = [...contentEntryConfigByExtension.keys()];
	const dataEntryExtensions = getDataEntryExtensions(settings);

	const virtualModContents = fsMod
		.readFileSync(virtualModuleTemplate, 'utf-8')
		.replace(
			'@@COLLECTION_NAME_BY_REFERENCE_KEY@@',
			new URL('reference-map.json', dotAstroDirectory).pathname
		)
		.replace('@@CONTENT_DIR@@', relContentDir)
		.replace(
			"'@@CONTENT_ENTRY_GLOB_PATH@@'",
			JSON.stringify(globWithUnderscoresIgnored(relContentDir, contentEntryExtensions))
		)
		.replace(
			"'@@DATA_ENTRY_GLOB_PATH@@'",
			JSON.stringify(globWithUnderscoresIgnored(relContentDir, dataEntryExtensions))
		)
		.replace(
			"'@@RENDER_ENTRY_GLOB_PATH@@'",
			JSON.stringify(
				globWithUnderscoresIgnored(
					relContentDir,
					/** Note: data collections excluded */ contentEntryExtensions
				)
			)
		);

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
				const stringifiedLookupMap = await getStringifiedLookupMap({
					fs: fsMod,
					contentDirectory,
					contentConfigFileUrl: contentConfigStats.url,
					contentEntryConfigByExtension,
					dataEntryExtensions,
					root: settings.config.root,
				});

				return {
					code: virtualModContents.replace(
						'/* @@LOOKUP_MAP_ASSIGNMENT@@ */',
						`lookupMap = ${stringifiedLookupMap};`
					),
				};
			}
		},
	};
}

/**
 * Generate a map from a collection + slug to the local file path.
 * This is used internally to resolve entry imports when using `getEntry()`.
 * @see `content-module.template.mjs`
 */
export async function getStringifiedLookupMap({
	contentDirectory,
	contentConfigFileUrl,
	contentEntryConfigByExtension,
	dataEntryExtensions,
	root,
	fs,
}: {
	contentDirectory: URL;
	contentConfigFileUrl: URL;
	contentEntryConfigByExtension: Map<string, ContentEntryType>;
	dataEntryExtensions: string[];
	root: URL;
	fs: typeof fsMod;
}) {
	const relContentDir = rootRelativePath(root, contentDirectory, false);
	const contentEntryExtensions = [...contentEntryConfigByExtension.keys()];

	let lookupMap: ContentLookupMap = {};
	const contentGlob = await glob(
		`${relContentDir}**/*${getExtGlob([...dataEntryExtensions, ...contentEntryExtensions])}`,
		{
			absolute: true,
			cwd: fileURLToPath(root),
			fs: {
				readdir: fs.readdir.bind(fs),
				readdirSync: fs.readdirSync.bind(fs),
			},
		}
	);

	// Run 10 at a time to prevent `await getEntrySlug` from accessing the filesystem all at once.
	// Each await shouldn't take too long for the work to be noticably slow too.
	const limit = pLimit(10);
	const promises: Promise<void>[] = [];

	for (const filePath of contentGlob) {
		promises.push(
			limit(async () => {
				const entryType = getEntryType({
					entryPath: filePath,
					contentEntryExtensions,
					dataEntryExtensions,
					contentDirectory,
					contentConfigFileUrl,
				});
				// Globbed ignored or unsupported entry.
				// Logs warning during type generation, should ignore in lookup map.
				if (entryType !== 'content' && entryType !== 'data') return;

				const collection = getEntryCollectionName({
					contentDirectory,
					entry: pathToFileURL(filePath),
				});
				if (!collection) throw UnexpectedLookupMapError;

				if (lookupMap[collection]?.type && lookupMap[collection].type !== entryType) {
					throw new AstroError({
						...AstroErrorData.MixedContentDataCollectionError,
						message: AstroErrorData.MixedContentDataCollectionError.message(collection),
					});
				}

				if (entryType === 'content') {
					const contentEntryType = contentEntryConfigByExtension.get(extname(filePath));
					if (!contentEntryType) throw UnexpectedLookupMapError;

					const { id, slug: generatedSlug } = await getContentEntryIdAndSlug({
						entry: pathToFileURL(filePath),
						contentDirectory,
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
					const id = getDataEntryId({
						entry: pathToFileURL(filePath),
						contentDirectory,
						collection,
					});
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

	return JSON.stringify(lookupMap);
}

const UnexpectedLookupMapError = new AstroError({
	...AstroErrorData.UnknownContentCollectionError,
	message: `Unexpected error while parsing content entry IDs and slugs.`,
});

function globWithUnderscoresIgnored(relContentDirectory: string, exts: string[]): string[] {
	const extGlob = getExtGlob(exts);
	const contentDirectory = appendForwardSlash(relContentDirectory);
	return [
		`${contentDirectory}**/*${extGlob}`,
		`!${contentDirectory}**/_*/**/*${extGlob}`,
		`!${contentDirectory}**/_*${extGlob}`,
	];
}
