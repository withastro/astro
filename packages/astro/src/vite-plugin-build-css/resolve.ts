import type { ResolveIdHook, LoadHook } from 'rollup';
import type { ResolvedConfig, Plugin as VitePlugin } from '../core/vite';

export function getVitePluginByName(viteConfig: ResolvedConfig, pluginName: string): VitePlugin {
  const plugin = viteConfig.plugins.find(({ name }) => name === pluginName);
  if (!plugin) throw new Error(`${pluginName} plugin couldn’t be found`);
  return plugin;
}

export function getViteResolvePlugin(viteConfig: ResolvedConfig): VitePlugin {
  return getVitePluginByName(viteConfig, 'vite:resolve');
}

export function getViteLoadFallbackPlugin(viteConfig: ResolvedConfig): VitePlugin {
  return getVitePluginByName(viteConfig, 'vite:load-fallback');
}

export function getViteResolve(viteConfig: ResolvedConfig): ResolveIdHook {
  const plugin = getViteResolvePlugin(viteConfig);
  if (!plugin.resolveId) throw new Error(`vite:resolve has no resolveId() hook`);
  return plugin.resolveId.bind(null as any) as any;
}

export function getViteLoad(viteConfig: ResolvedConfig): LoadHook {
  const plugin = getViteLoadFallbackPlugin(viteConfig);
  if (!plugin.load) throw new Error(`vite:load-fallback has no load() hook`);
  return plugin.load.bind(null as any) as any;
}
