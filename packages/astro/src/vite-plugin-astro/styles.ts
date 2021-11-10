import type vite from '../core/vite';

import { PREPROCESSOR_EXTENSIONS } from '../core/ssr/css.js';

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
  attrs: Record<string, string>;
  id: string;
  transformHook: TransformHook;
  ssr?: boolean;
}

/** Transform style using Vite hook */
export async function transformWithVite({ value, attrs, transformHook, id, ssr }: TransformWithViteOptions): Promise<vite.TransformResult | null> {
  const lang = (`.${attrs.lang}` || '').toLowerCase(); // add leading "."; don’t be case-sensitive
  if (!PREPROCESSOR_EXTENSIONS.has(lang)) {
    return null; // only preprocess langs supported by Vite
  }
  return transformHook(value, id + `?astro&type=style&lang${lang}`, ssr);
}
