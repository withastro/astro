import fsMod from 'node:fs';
import * as path from 'node:path';
import type { Plugin } from 'vite';
import { normalizePath } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { appendForwardSlash, prependForwardSlash } from '../core/path.js';
import { VIRTUAL_MODULE_ID } from './consts.js';
import { getContentEntryExts, getContentPaths } from './utils.js';

interface AstroContentVirtualModPluginParams {
	settings: AstroSettings;
}

export function astroContentVirtualModPlugin({
	settings,
}: AstroContentVirtualModPluginParams): Plugin {
	const contentPaths = getContentPaths(settings.config);
	const relContentDir = normalizePath(
		appendForwardSlash(
			prependForwardSlash(
				path.relative(settings.config.root.pathname, contentPaths.contentDir.pathname)
			)
		)
	);
	const contentEntryExts = getContentEntryExts(settings);

	const extGlob =
		contentEntryExts.length === 1
			? // Wrapping {...} breaks when there is only one extension
			  contentEntryExts[0]
			: `{${contentEntryExts.join(',')}}`;
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
		load(id) {
			if (id === astroContentVirtualModuleId) {
				return {
					code: virtualModContents,
				};
			}
		},
	};
}
