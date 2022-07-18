import type * as vite from 'vite';

import path from 'path';
import { RuntimeMode } from '../../../@types/astro.js';
import { viteID } from '../../util.js';
import { STYLE_EXTENSIONS } from '../util.js';
import { crawlGraph } from './vite.js';

/** Given a filePath URL, crawl Vite’s module graph to find all style imports. */
export async function getStylesForURL(
	filePath: URL,
	viteServer: vite.ViteDevServer,
	mode: RuntimeMode
): Promise<{ urls: Set<string>; stylesMap: Map<string, string> }> {
	const importedCssUrls = new Set<string>();
	const importedStylesMap = new Map<string, string>();

	for await (const importedModule of crawlGraph(viteServer, viteID(filePath), true)) {
		const ext = path.extname(importedModule.url).toLowerCase();
		if (STYLE_EXTENSIONS.has(ext)) {
			if (
				mode === 'development' && // only inline in development
				typeof importedModule.ssrModule?.default === 'string' // ignore JS module styles
			) {
				importedStylesMap.set(importedModule.url, importedModule.ssrModule.default);
			} else {
				// NOTE: We use the `url` property here. `id` would break Windows.
				importedCssUrls.add(importedModule.url);
			}
		}
	}

	return {
		urls: importedCssUrls,
		stylesMap: importedStylesMap,
	};
}
