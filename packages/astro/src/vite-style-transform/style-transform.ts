import type { PluginContext } from 'rollup';
import { fileURLToPath } from 'url';
import type { TransformStyle } from '../core/compile/index';
import { createTransformStyleWithViteFn, TransformStyleWithVite } from './transform-with-vite.js';

import type * as vite from 'vite';

export type ViteStyleTransformer = {
	viteDevServer?: vite.ViteDevServer;
	transformStyleWithVite: TransformStyleWithVite;
};

export function createViteStyleTransformer(viteConfig: vite.ResolvedConfig): ViteStyleTransformer {
	return {
		transformStyleWithVite: createTransformStyleWithViteFn(viteConfig),
	};
}

function getNormalizedIDForPostCSS(filename: string): string {
	try {
		const filenameURL = new URL(`file://${filename}`);
		return fileURLToPath(filenameURL);
	} catch (err) {
		// Not a real file, so just use the provided filename as the normalized id
		return filename;
	}
}

export function createTransformStyles(
	viteStyleTransformer: ViteStyleTransformer,
	filename: string,
	ssr: boolean,
	pluginContext: PluginContext
): TransformStyle {
	// handleHotUpdate doesn't have `addWatchFile` used by transformStyleWithVite.
	// TODO, refactor, why is this happening *here* ?
	if (!pluginContext.addWatchFile) {
		pluginContext.addWatchFile = () => {};
	}

	const normalizedID = getNormalizedIDForPostCSS(filename);

	return async function (styleSource, lang) {
		const result = await viteStyleTransformer.transformStyleWithVite.call(pluginContext, {
			id: normalizedID,
			source: styleSource,
			lang,
			ssr,
			viteDevServer: viteStyleTransformer.viteDevServer,
		});

		return result;
	};
}
