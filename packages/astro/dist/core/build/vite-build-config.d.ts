import type * as vite from 'vite';
import type { RouteData } from '../../types/public/internal.js';
import type { AstroSettings } from '../../types/astro.js';
export interface CreateViteBuildConfigOptions {
	/** The resolved Astro settings. */
	settings: AstroSettings;
	/** The base Vite config produced by createVite(). */
	viteConfig: vite.InlineConfig;
	/** All routes to be built. */
	routes: RouteData[];
	/** Assembled Vite plugins (build plugins + user plugins). */
	plugins: vite.PluginOption[];
	/** The buildApp callback for the Vite builder. */
	builder: vite.BuilderOptions;
	/**
	 * A function that checks whether a given module name is a rollup input.
	 * Used by entryFileNames to determine the server entry.
	 */
	isRollupInput: (moduleName: string | null) => boolean;
}
/**
 * Creates the Vite InlineConfig used for the multi-environment build.
 *
 * This is a pure config assembly function — it does not execute the build.
 * Extracted from `buildEnvironments()` to enable unit testing of config
 * merging behavior (e.g. user rollup output overrides).
 */
export declare function createViteBuildConfig(
	opts: CreateViteBuildConfigOptions,
): vite.InlineConfig;
