import type * as vite from 'vite';

import { STYLE_EXTENSIONS } from '../core/render/dev/css.js';

export type TransformHook = (code: string, id: string, ssr?: boolean) => Promise<vite.TransformResult>;

/** Load vite:css’ transform() hook */
export function getViteTransform(viteConfig: vite.ResolvedConfig): TransformHook {
	const viteCSSPlugin = viteConfig.plugins.find(({ name }) => name === 'vite:css');
	if (!viteCSSPlugin) throw new Error(`vite:css plugin couldn’t be found`);
	if (!viteCSSPlugin.transform) throw new Error(`vite:css has no transform() hook`);
	return viteCSSPlugin.transform.bind(null as any) as any;
}

interface TransformWithViteOptions {
	value: string;
	lang: string;
	id: string;
	transformHook: TransformHook;
	ssr?: boolean;
}

/** Transform style using Vite hook */
export async function transformWithVite({ value, lang, transformHook, id, ssr }: TransformWithViteOptions): Promise<vite.TransformResult | null> {
	if (!STYLE_EXTENSIONS.has(lang)) {
		return null; // only preprocess langs supported by Vite
	}
	return transformHook(value, id + `?astro&type=style&lang${lang}`, ssr);
}
