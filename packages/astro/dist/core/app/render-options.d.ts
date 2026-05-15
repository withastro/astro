import type { ResolvedRenderOptions } from './base.js';
/**
 * Reads `ResolvedRenderOptions` that were attached to a request via
 * `renderOptionsSymbol`. Returns `undefined` if no options are attached.
 */
export declare function getRenderOptions(request: Request): ResolvedRenderOptions | undefined;
/**
 * Attaches `ResolvedRenderOptions` to a request via `renderOptionsSymbol` so
 * that downstream handlers can read them.
 */
export declare function setRenderOptions(request: Request, options: ResolvedRenderOptions): void;
