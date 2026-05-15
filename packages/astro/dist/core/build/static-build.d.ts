import { type BuildInternals } from '../../core/build/internal.js';
import type { RouteData } from '../../types/public/internal.js';
import type { StaticBuildOptions } from './types.js';
/**
 * Minimal chunk data extracted from RollupOutput for deferred manifest/content injection.
 * Allows releasing full RollupOutput objects early to reduce memory usage.
 */
export interface ExtractedChunk {
	fileName: string;
	code: string;
	moduleIds: string[];
	prerender: boolean;
}
export declare function viteBuild(opts: StaticBuildOptions): Promise<{
	internals: BuildInternals;
}>;
/**
 * This function takes the virtual module name of any page entrypoint and
 * transforms it to generate a final `.mjs` output file.
 *
 * Input: `@astro-page:src/pages/index@_@astro`
 * Output: `pages/index.astro.mjs`
 * Input: `@astro-page:../node_modules/my-dep/injected@_@astro`
 * Output: `pages/injected.mjs`
 *
 * 1. We clean the `facadeModuleId` by removing the `ASTRO_PAGE_MODULE_ID` prefix and `ASTRO_PAGE_EXTENSION_POST_PATTERN`.
 * 2. We find the matching route pattern in the manifest (or fall back to the cleaned module id)
 * 3. We replace square brackets with underscore (`[slug]` => `_slug_`) and `...` with `` (`[...slug]` => `_---slug_`).
 * 4. We append the `.mjs` extension, so the file will always be an ESM module
 *
 * @param prefix string
 * @param facadeModuleId string
 * @param pages AllPagesData
 */
export declare function makeAstroPageEntryPointFileName(
	prefix: string,
	facadeModuleId: string,
	routes: RouteData[],
): string;
