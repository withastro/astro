import type { AstroSettings } from '../../types/astro.js';
import type { RouteData } from '../../types/public/internal.js';
import type { AstroLogger } from '../logger/core.js';
/**
 * Parses the `export const prerender = true|false` declaration from a route's
 * source content. Returns `true`, `false`, or `undefined` if not present.
 */
export declare function parsePrerenderExport(content: string): boolean | undefined;
export declare function getRoutePrerenderOption(
	content: string,
	route: RouteData,
	settings: AstroSettings,
	logger: AstroLogger,
): Promise<void>;
