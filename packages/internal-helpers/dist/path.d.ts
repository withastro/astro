/**
 * A set of common path utilities commonly used through the Astro core and integration
 * projects. These do things like ensure a forward slash prepends paths.
 */
export declare function appendExtension(path: string, extension: string): string;
export declare function appendForwardSlash(path: string): string;
export declare function prependForwardSlash(path: string): string;
export declare const MANY_LEADING_SLASHES: RegExp;
export declare function collapseDuplicateLeadingSlashes(path: string): string;
export declare function collapseDuplicateSlashes(path: string): string;
export declare const MANY_TRAILING_SLASHES: RegExp;
export declare function collapseDuplicateTrailingSlashes(
	path: string,
	trailingSlash: boolean,
): string;
export declare function removeTrailingForwardSlash(path: string): string;
export declare function removeLeadingForwardSlash(path: string): string;
export declare function removeLeadingForwardSlashWindows(path: string): string;
export declare function trimSlashes(path: string): string;
export declare function isRelativePath(path: string): boolean;
export declare function isInternalPath(path: string): boolean;
export declare function joinPaths(...paths: (string | undefined)[]): string;
export declare function removeFileExtension(path: string): string;
export declare function removeQueryString(path: string): string;
/**
 * Checks whether the path is considered a remote path.
 * Remote means untrusted in this context, so anything that isn't a straightforward
 * local path is considered remote.
 *
 * @param src
 */
export declare function isRemotePath(src: string): boolean;
/**
 * Checks if parentPath is a parent directory of childPath.
 */
export declare function isParentDirectory(parentPath: string, childPath: string): boolean;
export declare function slash(path: string): string;
export declare function fileExtension(path: string): string;
export declare function removeBase(path: string, base: string): string;
export declare function hasFileExtension(path: string): boolean;
/**
 * Normalizes a URL pathname to match the canonical form used by route generation.
 * This reverses the transformations done by `getUrlForPath` in generate.ts.
 *
 * - For `buildFormat: 'file'`: strips `.html` extension
 * - For `buildFormat: 'directory'/'preserve'` with `trailingSlash: 'ignore'`: strips trailing slash
 *
 * @param pathname - The URL pathname to normalize
 * @param buildFormat - The build format ('file', 'directory', or 'preserve')
 * @param trailingSlash - The trailing slash setting ('always', 'never', or 'ignore')
 */
export declare function normalizePathname(
	pathname: string,
	buildFormat: 'file' | 'directory' | 'preserve',
	trailingSlash: 'always' | 'never' | 'ignore',
): string;
