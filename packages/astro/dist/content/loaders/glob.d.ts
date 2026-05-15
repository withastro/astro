import type { Loader } from './types.js';
interface GenerateIdOptions {
	/** The path to the entry file, relative to the base directory. */
	entry: string;
	/** The base directory URL. */
	base: URL;
	/** The parsed, unvalidated data of the entry. */
	data: Record<string, unknown>;
}
interface GlobOptions {
	/** The glob pattern to match files, relative to the base directory */
	pattern: string | Array<string>;
	/** The base directory to resolve the glob pattern from. Relative to the root directory, or an absolute file URL. Defaults to `.` */
	base?: string | URL;
	/**
	 * Function that generates an ID for an entry. Default implementation generates a slug from the entry path.
	 * @returns The ID of the entry. Must be unique per collection.
	 **/
	generateId?: (options: GenerateIdOptions) => string;
	/**
	 * Retains the unparsed body of the file in the data store, in addition to the rendered HTML.
	 * If `false`, `entry.body` will be undefined if the content type has a parser.
	 * Defaults to `true`.
	 */
	retainBody?: boolean;
}
export declare const secretLegacyFlag: unique symbol;
/**
 * Loads multiple entries, using a glob pattern to match files.
 * @param pattern A glob pattern to match files, relative to the content directory.
 */
export declare function glob(
	globOptions: GlobOptions & {
		[secretLegacyFlag]?: boolean;
	},
): Loader;
export {};
