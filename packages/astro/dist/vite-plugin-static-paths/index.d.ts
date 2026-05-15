import type { Plugin } from 'vite';
/**
 * Virtual module that exposes StaticPaths class for prerendering.
 * This allows adapters to use StaticPaths from their runtime (e.g., workerd)
 * to collect all prerenderable paths.
 *
 * Only works in the 'prerender' environment - returns no-op in other environments.
 */
export default function vitePluginStaticPaths(): Plugin;
