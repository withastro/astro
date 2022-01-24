import { Plugin } from '../plugin';
import { ResolvedConfig } from '../config';
/**
 * Convert `new URL('./foo.png', import.meta.url)` to its resolved built URL
 *
 * Supports template string with dynamic segments:
 * ```
 * new URL(`./dir/${name}.png`, import.meta.url)
 * // transformed to
 * import.meta.globEager('./dir/**.png')[`./dir/${name}.png`].default
 * ```
 */
export declare function assetImportMetaUrlPlugin(config: ResolvedConfig): Plugin;
