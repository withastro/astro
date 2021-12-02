import type { Plugin as VitePlugin } from '../core/vite';

export function vitePluginNewBuild(): VitePlugin {
  return {
    name: '@astro/rollup-plugin-new-build',

    configResolved(resolvedConfig) {
      // Delete this hook because it causes assets not to be built
      const plugins = resolvedConfig.plugins as VitePlugin[];
      const viteAsset = plugins.find((p) => p.name === 'vite:asset');
      if(viteAsset) {
        delete viteAsset.generateBundle;
      }
    }
  }
}