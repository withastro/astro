import type { ExtractedChunk } from '../static-build.js';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';
/**
 * Unified manifest system architecture:
 *
 * The serialized manifest (virtual:astro:manifest) is now the single source of truth
 * for both dev and production builds:
 *
 * - In dev: The serialized manifest is used directly (pre-computed manifest data)
 * - In prod: Two-stage process:
 *   1. serialized.ts emits a placeholder (MANIFEST_REPLACE token) during bundling
 *   2. plugin-manifest injects the real build-specific data at the end
 *
 * This flow eliminates dual virtual modules and simplifies the architecture:
 * - pluginManifestBuild: Registers SERIALIZED_MANIFEST_ID as Vite input
 * - pluginManifestBuild.generateBundle: Tracks the serialized manifest chunk filename
 * - manifestBuildPostHook: Finds the chunk, computes final manifest data, and replaces the token
 *
 * The placeholder mechanism allows serialized.ts to emit during vite build without knowing
 * the final build-specific data (routes, assets, CSP hashes, etc) that's only available
 * after bundling completes.
 */
export declare const MANIFEST_REPLACE = '@@ASTRO_MANIFEST_REPLACE@@';
/**
 * Post-build hook that injects the computed manifest into bundled chunks.
 * Finds the serialized manifest chunk and replaces the placeholder token with real data.
 */
export declare function manifestBuildPostHook(
	options: StaticBuildOptions,
	internals: BuildInternals,
	{
		chunks,
		mutate,
	}: {
		chunks: ExtractedChunk[];
		mutate: (fileName: string, code: string, prerender: boolean) => void;
	},
): Promise<void>;
