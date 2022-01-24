export declare const DEFAULT_MAIN_FIELDS: string[];
export declare const DEFAULT_EXTENSIONS: string[];
export declare const JS_TYPES_RE: RegExp;
export declare const OPTIMIZABLE_ENTRY_RE: RegExp;
export declare const SPECIAL_QUERY_RE: RegExp;
/**
 * Prefix for resolved fs paths, since windows paths may not be valid as URLs.
 */
export declare const FS_PREFIX = "/@fs/";
/**
 * Prefix for resolved Ids that are not valid browser import specifiers
 */
export declare const VALID_ID_PREFIX = "/@id/";
/**
 * Plugins that use 'virtual modules' (e.g. for helper functions), prefix the
 * module ID with `\0`, a convention from the rollup ecosystem.
 * This prevents other plugins from trying to process the id (like node resolution),
 * and core features like sourcemaps can use this info to differentiate between
 * virtual modules and regular files.
 * `\0` is not a permitted char in import URLs so we have to replace them during
 * import analysis. The id will be decoded back before entering the plugins pipeline.
 * These encoded virtual ids are also prefixed by the VALID_ID_PREFIX, so virtual
 * modules in the browser end up encoded as `/@id/__x00__{id}`
 */
export declare const NULL_BYTE_PLACEHOLDER = "__x00__";
export declare const CLIENT_PUBLIC_PATH = "/@vite/client";
export declare const ENV_PUBLIC_PATH = "/@vite/env";
export declare const CLIENT_ENTRY: string;
export declare const ENV_ENTRY: string;
export declare const CLIENT_DIR: string;
export declare const KNOWN_ASSET_TYPES: string[];
export declare const DEFAULT_ASSETS_RE: RegExp;
export declare const DEP_VERSION_RE: RegExp;
