import glob from 'fast-glob';
import fsMod from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { rootRelativePath } from '../core/util.js';
import { VIRTUAL_MODULE_ID } from './consts.js';
import {
	getContentEntryConfigByExtMap,
	getContentEntryIdAndSlug,
	getContentPaths,
	getDataEntryExts,
	getDataEntryId,
	getEntryCollectionName,
	getEntrySlug,
	getEntryType,
	getExtGlob,
	type ContentLookupMap,
	type ContentPaths,
} from './utils.js';

interface AstroContentVirtualModPluginParams {
	settings: AstroSettings;
}

export function astroContentVirtualModPlugin({
	settings,
}: AstroContentVirtualModPluginParams): Plugin {
	const contentPaths = getContentPaths(settings.config);
	const relContentDir = rootRelativePath(settings.config.root, contentPaths.contentDir);

	const contentEntryConfigByExt = getContentEntryConfigByExtMap(settings);
	const contentEntryExts = [...contentEntryConfigByExt.keys()];
	const dataEntryExts = getDataEntryExts(settings);

	const virtualModContents = fsMod
		.readFileSync(contentPaths.virtualModTemplate, 'utf-8')
		.replace(
			'@@COLLECTION_NAME_BY_REFERENCE_KEY@@',
			new URL('reference-map.json', contentPaths.cacheDir).pathname
		)
		.replace('@@CONTENT_DIR@@', relContentDir)
		.replace('@@CONTENT_ENTRY_GLOB_PATH@@', `${relContentDir}**/*${getExtGlob(contentEntryExts)}`)
		.replace('@@DATA_ENTRY_GLOB_PATH@@', `${relContentDir}**/*${getExtGlob(dataEntryExts)}`)
		.replace(
			'@@RENDER_ENTRY_GLOB_PATH@@',
			`${relContentDir}**/*${getExtGlob(/** Note: data collections excluded */ contentEntryExts)}`
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
					contentPaths,
					contentEntryConfigByExt,
					dataEntryExts,
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
 * @see `src/content/virtual-mod.mjs`
 */
export async function getStringifiedLookupMap({
	contentPaths,
	contentEntryConfigByExt,
	dataEntryExts,
	root,
	fs,
}: {
	contentEntryConfigByExt: ReturnType<typeof getContentEntryConfigByExtMap>;
	dataEntryExts: string[];
	contentPaths: Pick<ContentPaths, 'contentDir' | 'config'>;
	root: URL;
	fs: typeof fsMod;
}) {
	const { contentDir } = contentPaths;
	const relContentDir = rootRelativePath(root, contentDir, false);
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
	);

	await Promise.all(
		contentGlob.map(async (filePath) => {
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

	return JSON.stringify(lookupMap);
}

const UnexpectedLookupMapError = new AstroError({
	...AstroErrorData.UnknownContentCollectionError,
	message: `Unexpected error while parsing content entry IDs and slugs.`,
});
