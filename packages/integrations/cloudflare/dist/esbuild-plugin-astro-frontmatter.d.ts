import type { DepOptimizationConfig } from 'vite';
type ESBuildPlugin = NonNullable<
	NonNullable<DepOptimizationConfig['esbuildOptions']>['plugins']
>[0];
/**
 * An esbuild plugin that extracts frontmatter from .astro files during
 * dependency optimization scanning. This allows Vite to discover imports
 * in the server-side frontmatter code.
 */
export declare function astroFrontmatterScanPlugin(): ESBuildPlugin;
export {};
