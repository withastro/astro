import type { Plugin as VitePlugin, ViteDevServer } from 'vite';
import type { AstroConfig } from '../@types/astro';

export interface PluginOptions {
  astroConfig: AstroConfig;
  viteServer: ViteDevServer;
}

export function rollupPluginAstroBuildLoadFallback({ astroConfig, viteServer }: PluginOptions): VitePlugin {
  let viteFallback: VitePlugin | undefined;

  return {
    name: '@astro/rollup-plugin-build-load-fallback',
    enforce: 'post',
    configResolved(resolvedConfig) {
      resolvedConfig.plugins?.findIndex(p => p.name === '');

      // Move this plugin right before the end. vite:load-fallback throws if nothing
      // is found. But we want to try it and if it fails, try to get from SSR.
      const plugins = resolvedConfig.plugins as VitePlugin[];
      const ourIndex = plugins.findIndex((p) => p.name === '@astro/rollup-plugin-build-load-fallback');
      if (ourIndex !== -1) {
        const ourPlugin = plugins[ourIndex];
        plugins.splice(ourIndex, 1);
        plugins.splice(plugins.length - 1, 0, ourPlugin);
        viteFallback = plugins.find(p => p.name === 'vite:load-fallback');
      }
    },
    resolveId(id) {
      // If we got here, nothing picked up this module, so let's try
      // and grab it from the viteServer used for SSR loading.
      if(id[0] === '/' && !id.startsWith(astroConfig.projectRoot.pathname)) {
        return id;
      }
      return null;
    },
    async load(id) {
      if(id[0] === '/' && !id.startsWith(astroConfig.projectRoot.pathname)) {
        try {
          if(viteFallback) {
            // First try viteFallback. Assuming this is a filepath, it will pick it up.
            return await viteFallback.load?.call(this, id);
          }
        } catch {
          try {
            // This uses ssrLoadModule and not transformResult because
            // transformResult is always giving JavaScript.
            const mod = await viteServer.ssrLoadModule(id);
            return mod.default;
          } catch {
            return null;
          }
        }
      }

      return null;
    }
  };
}