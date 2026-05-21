import type { ResolvedRenderOptions } from './base.js';

/**
 * Symbol used to attach `ResolvedRenderOptions` to a `Request` object so
 * that they can flow through the `FetchHandler` signature (which only takes
 * a request) into the `AstroHandler`. This is an internal implementation
 * detail between `BaseApp` and the default handler pipeline.
 */
const renderOptionsSymbol = Symbol.for('astro.renderOptions');

/**
 * Reads `ResolvedRenderOptions` that were attached to a request via
 * `renderOptionsSymbol`. Returns `undefined` if no options are attached.
 */
export function getRenderOptions(request: Request): ResolvedRenderOptions | undefined {
	return Reflect.get(request, renderOptionsSymbol);
}

/**
 * Attaches `ResolvedRenderOptions` to a request via `renderOptionsSymbol` so
 * that downstream handlers can read them.
 */
export function setRenderOptions(request: Request, options: ResolvedRenderOptions): void {
	Reflect.set(request, renderOptionsSymbol, options);
}
