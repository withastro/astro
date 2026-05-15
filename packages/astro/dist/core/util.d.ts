import type { AstroSettings } from '../types/astro.js';
import type { AstroConfig } from '../types/public/config.js';
import type { RouteData } from '../types/public/internal.js';
/** Check if a file is a markdown file based on its extension */
export declare function isMarkdownFile(
	fileId: string,
	option?: {
		suffix?: string;
	},
): boolean;
/**
 * Get the correct output filename for a route, based on your config.
 * Handles both "/foo" and "foo" `name` formats.
 * Handles `/404` and `/` correctly.
 */
export declare function getOutputFilename(
	buildFormat: NonNullable<AstroConfig['build']>['format'],
	name: string,
	routeData: RouteData,
): string;
/** is a specifier an npm package? */
export declare function parseNpmName(spec: string):
	| {
			scope?: string;
			name: string;
			subpath?: string;
	  }
	| undefined;
/**
 * Convert file URL to ID for environment.moduleGraph.idToModuleMap.get(:viteID)
 * Format:
 *   Linux/Mac:  /Users/astro/code/my-project/src/pages/index.astro
 *   Windows:    C:/Users/astro/code/my-project/src/pages/index.astro
 */
export declare function viteID(filePath: URL): string;
export declare const VALID_ID_PREFIX = '/@id/';
export declare function unwrapId(id: string): string;
export declare function wrapId(id: string): string;
export declare function resolvePages(config: AstroConfig): URL;
export declare function isPage(file: URL, settings: AstroSettings): boolean;
export declare function isEndpoint(file: URL, settings: AstroSettings): boolean;
export declare function resolveJsToTs(filePath: string): string;
/**
 * Set a default NODE_ENV so Vite doesn't set an incorrect default when loading the Astro config
 */
export declare function ensureProcessNodeEnv(defaultNodeEnv: string): void;
