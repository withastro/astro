import type vite from '../core/vite';

export type TransformHook = (code: string, id: string, ssr?: boolean) => Promise<vite.TransformResult>;

// https://vitejs.dev/guide/features.html#css-pre-processors
const SUPPORTED_PREPROCESSORS = new Set(['scss', 'sass', 'styl', 'stylus', 'less']);

/** Load vite:css’ transform() hook */
export function getViteTransform(viteConfig: vite.ResolvedConfig): TransformHook {
  const viteCSSPlugin = viteConfig.plugins.find(({ name }) => name === 'vite:css');
  if (!viteCSSPlugin) throw new Error(`vite:css plugin couldn’t be found`);
  if (!viteCSSPlugin.transform) throw new Error(`vite:css has no transform() hook`);
  return viteCSSPlugin.transform.bind(null as any) as any;
}

/** Transform style using Vite hook */
export async function transformWithVite(value: string, attrs: Record<string, string>, id: string, transformHook: TransformHook): Promise<vite.TransformResult | null> {
  const lang = (attrs.lang || '').toLowerCase(); // don’t be case-sensitive
  if (!SUPPORTED_PREPROCESSORS.has(lang)) return null; // only preprocess the above
  const result = await transformHook(value, id.replace(/\.astro$/, `.${lang}`));
  return result || null;
}
