import glob, { type Options as FastGlobOptions } from 'fast-glob';
import fsMod from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { rootRelativePath } from '../core/util.js';
import { VIRTUAL_MODULE_ID } from './consts.js';
import {
	getContentEntryConfigByExtMap,
	getContentPaths,
	getEntryInfo,
	getEntrySlug,
	getExtGlob,
	hasUnderscoreBelowContentDirectoryPath,
	NoCollectionError,
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

	const extGlob = getExtGlob(contentEntryExts);
	const entryGlob = `${relContentDir}**/*${extGlob}`;
	const virtualModContents = fsMod
		.readFileSync(contentPaths.virtualModTemplate, 'utf-8')
		.replace('@@CONTENT_DIR@@', relContentDir)
		.replace('@@ENTRY_GLOB_PATH@@', entryGlob)
		.replace('@@RENDER_ENTRY_GLOB_PATH@@', entryGlob);

	const astroContentVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

	return {
		name: 'astro-content-virtual-mod-plugin',
		enforce: 'pre',
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return astroContentVirtualModuleId;
			}
		},
		async load(id) {
			const stringifiedLookupMap = await getStringifiedLookupMap({
				fs: fsMod,
				contentPaths,
				contentEntryConfigByExt,
				root: settings.config.root,
			});

			if (id === astroContentVirtualModuleId) {
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
 * This is used internally to resolve entry imports when using `getEntryBySlug()`.
 * @see `src/content/virtual-mod.mjs`
 */
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
		contentGlob
			// Ignore underscore files in lookup map
			.filter((e) => !hasUnderscoreBelowContentDirectoryPath(pathToFileURL(e), contentDir))
			.map(async (filePath) => {
				const info = getEntryInfo({ contentDir, entry: filePath });
				// Globbed entry outside a collection directory
				// Log warning during type generation, safe to ignore in lookup map
				if (info instanceof NoCollectionError) return;
				const contentEntryType = contentEntryConfigByExt.get(extname(filePath));
				if (!contentEntryType) return;

				const { id, collection, slug: generatedSlug } = info;
				const slug = await getEntrySlug({
					id,
					collection,
					generatedSlug,
					fs,
					fileUrl: pathToFileURL(filePath),
					contentEntryType,
				});
				filePathByLookupId[collection] = {
					...filePathByLookupId[collection],
					[slug]: rootRelativePath(root, filePath),
				};
			})
	);

	return JSON.stringify(filePathByLookupId);
}
