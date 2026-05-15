import type { RSSOptions } from './index.js';
/** Normalize URL to its canonical form */
export declare function createCanonicalURL(
	url: string,
	trailingSlash?: RSSOptions['trailingSlash'],
	base?: string,
): string;
/** Check if a URL is already valid */
export declare function isValidURL(url: string): boolean;
