import fsMod from 'node:fs';
import type { Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { VIRTUAL_MODULE_ID } from './consts.js';
import glob, { type Options as FastGlobOptions } from 'fast-glob';
import {
	getContentEntryConfigByExtMap,
	getDataEntryExts,
	getContentPaths,
	getExtGlob,
	getEntryCollectionName,
	getContentEntryIdAndSlug,
	getEntrySlug,
	getDataEntryId,
} from './utils.js';
import { rootRelativePath } from '../core/util.js';
import { extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
		enforce: 'pre',
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return astroContentVirtualModuleId;
			}
		},
		async load(id) {
			const stringifiedLookupMap = await getStringifiedLookupMap({
				fs: fsMod,
				contentDir: contentPaths.contentDir,
				contentEntryConfigByExt,
				dataEntryExts,
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

export type ContentLookupMap = {
	[collectionName: string]: { type: 'content' | 'data'; entries: { [lookupId: string]: string } };
};

export async function getStringifiedLookupMap({
	contentDir,
	contentEntryConfigByExt,
	dataEntryExts,
	root,
	fs,
}: {
	contentEntryConfigByExt: ReturnType<typeof getContentEntryConfigByExtMap>;
	dataEntryExts: string[];
	contentDir: URL;
	root: URL;
	fs: typeof fsMod;
}) {
	const globOpts: FastGlobOptions = {
		absolute: true,
		cwd: fileURLToPath(root),
		fs: {
			readdir: fs.readdir.bind(fs),
			readdirSync: fs.readdirSync.bind(fs),
		},
	};

	let lookupMap: ContentLookupMap = {};
	const relContentDir = rootRelativePath(root, contentDir, false);
	const contentGlob = await glob(
		`${relContentDir}**/*${getExtGlob([...contentEntryConfigByExt.keys()])}`,
		globOpts
	);

	await Promise.all(
		contentGlob.map(async (filePath) => {
			const contentEntryType = contentEntryConfigByExt.get(extname(filePath));
			if (!contentEntryType) return;
			const collection = getEntryCollectionName({ contentDir, entry: pathToFileURL(filePath) });
			// Globbed entry outside of a collection
			// Logs warning on type generation, safe to ignore in lookup map
			if (!collection) return;

			const { id, slug: generatedSlug } = await getContentEntryIdAndSlug({
				entry: pathToFileURL(filePath),
				contentDir,
				collection,
			});
			lookupMap[collection] ??= { type: 'content', entries: {} };
			const slug = await getEntrySlug({
				id,
				collection,
				generatedSlug,
				fs,
				fileUrl: pathToFileURL(filePath),
				contentEntryType,
			});
			lookupMap[collection].entries[slug] = rootRelativePath(root, filePath);
		})
	);

	const dataGlob = await glob(`${relContentDir}**/*${getExtGlob(dataEntryExts)}`, globOpts);
	await Promise.all(
		dataGlob.map(async (filePath) => {
			const collection = getEntryCollectionName({
				contentDir,
				entry: pathToFileURL(filePath),
			});
			if (!collection) return;

			const id = getDataEntryId({
				entry: pathToFileURL(filePath),
				contentDir,
				collection,
			});
			lookupMap[collection] ??= { type: 'data', entries: {} };
			lookupMap[collection].entries[id] = rootRelativePath(root, filePath);
		})
	);

	return JSON.stringify(lookupMap);
}
