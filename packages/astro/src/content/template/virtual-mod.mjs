// astro-head-inject
import {
	createCollectionToGlobResultMap,
	createGetCollection,
	createGetEntryBySlug,
} from 'astro/content/runtime';

import { z } from 'astro/zod';
export { z };

export function defineCollection(config) {
	return config;
}

const contentDir = '@@CONTENT_DIR@@';

const entryGlob = import.meta.glob('@@ENTRY_GLOB_PATH@@', {
	query: { astroContent: true },
});
const collectionToEntryMap = createCollectionToGlobResultMap({
	globResult: entryGlob,
	contentDir,
});

const renderEntryGlob = import.meta.glob('@@RENDER_ENTRY_GLOB_PATH@@', {
	query: { astroPropagatedAssets: true },
});
const collectionToRenderEntryMap = createCollectionToGlobResultMap({
	globResult: renderEntryGlob,
	contentDir,
});

export const getCollection = createGetCollection({
	collectionToEntryMap,
	collectionToRenderEntryMap,
});

export const getEntryBySlug = createGetEntryBySlug({
	getCollection,
	collectionToRenderEntryMap,
});

export function image() {
	let astroContext = undefined;
	const str = z.string();
	const _parse = str._parse;
	str._parse = function(ctx){
		// Walk up the parents until we find the Astro context.
		let parent = ctx.parent;
		while(parent) {
			if(parent.astro) {
				astroContext = parent.astro;
				break;
			} else {
				parent = parent.parent;
			}
		}
		return _parse.call(this, ctx);

	}
	return str.transform(async (imagePath, ctx) => {
		const {
			settings,
			pluginContext,
			filePath: entryFilePath
		} = astroContext;
		const resolvedFilePath = (await pluginContext.resolve(imagePath, entryFilePath))?.id;
		const metadata = await emitESMImage(
			resolvedFilePath,
			pluginContext.meta.watchMode,
			pluginContext.emitFile,
			settings
		);

		if (!metadata) {
			ctx.addIssue({
				code: 'custom',
				message: `Image ${imagePath} does not exist. Is the path correct?`,
				fatal: true,
			});

			return z.NEVER;
		}

		return metadata;
	});
}
