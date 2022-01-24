import debug from 'debug';
import { FSWatcher } from 'chokidar';
import { DecodedSourceMap, RawSourceMap } from '@ampproject/remapping/dist/types/types';
export declare function slash(p: string): string;
export declare function unwrapId(id: string): string;
export declare const flattenId: (id: string) => string;
export declare const normalizeId: (id: string) => string;
export declare function isBuiltin(id: string): boolean;
export declare function moduleListContains(moduleList: string[] | undefined, id: string): boolean | undefined;
export declare const bareImportRE: RegExp;
export declare const deepImportRE: RegExp;
export declare let isRunningWithYarnPnp: boolean;
export declare function resolveFrom(id: string, basedir: string, preserveSymlinks?: boolean, ssr?: boolean): string;
/**
 * like `resolveFrom` but supports resolving `>` path in `id`,
 * for example: `foo > bar > baz`
 */
export declare function nestedResolveFrom(id: string, basedir: string, preserveSymlinks?: boolean): string;
interface DebuggerOptions {
    onlyWhenFocused?: boolean | string;
}
export declare type ViteDebugScope = `vite:${string}`;
export declare function createDebugger(namespace: ViteDebugScope, options?: DebuggerOptions): debug.Debugger['log'];
export declare const isWindows: boolean;
export declare function normalizePath(id: string): string;
export declare function fsPathFromId(id: string): string;
export declare function ensureVolumeInPath(file: string): string;
export declare const queryRE: RegExp;
export declare const hashRE: RegExp;
export declare const cleanUrl: (url: string) => string;
export declare const externalRE: RegExp;
export declare const isExternalUrl: (url: string) => boolean;
export declare const dataUrlRE: RegExp;
export declare const isDataUrl: (url: string) => boolean;
export declare const virtualModuleRE: RegExp;
export declare const virtualModulePrefix = "virtual-module:";
export declare const isJSRequest: (url: string) => boolean;
export declare const isTsRequest: (url: string) => boolean;
export declare const isPossibleTsOutput: (url: string) => boolean;
export declare const getTsSrcPath: (filename: string) => string;
export declare const isImportRequest: (url: string) => boolean;
export declare const isInternalRequest: (url: string) => boolean;
export declare function removeImportQuery(url: string): string;
export declare function injectQuery(url: string, queryToInject: string): string;
export declare function removeTimestampQuery(url: string): string;
export declare function asyncReplace(input: string, re: RegExp, replacer: (match: RegExpExecArray) => string | Promise<string>): Promise<string>;
export declare function timeFrom(start: number, subtract?: number): string;
/**
 * pretty url for logging.
 */
export declare function prettifyUrl(url: string, root: string): string;
export declare function isObject(value: unknown): value is Record<string, any>;
export declare function isDefined<T>(value: T | undefined | null): value is T;
export declare function lookupFile(dir: string, formats: string[], pathOnly?: boolean): string | undefined;
export declare function pad(source: string, n?: number): string;
export declare function posToNumber(source: string, pos: number | {
    line: number;
    column: number;
}): number;
export declare function numberToPos(source: string, offset: number | {
    line: number;
    column: number;
}): {
    line: number;
    column: number;
};
export declare function generateCodeFrame(source: string, start?: number | {
    line: number;
    column: number;
}, end?: number): string;
export declare function writeFile(filename: string, content: string | Uint8Array): void;
/**
 * Use instead of fs.existsSync(filename)
 * #2051 if we don't have read permission on a directory, existsSync() still
 * works and will result in massively slow subsequent checks (which are
 * unnecessary in the first place)
 */
export declare function isFileReadable(filename: string): boolean;
/**
 * Delete every file and subdirectory. **The given directory must exist.**
 * Pass an optional `skip` array to preserve files in the root directory.
 */
export declare function emptyDir(dir: string, skip?: string[]): void;
export declare function copyDir(srcDir: string, destDir: string): void;
export declare function ensureLeadingSlash(path: string): string;
export declare function ensureWatchedFile(watcher: FSWatcher, file: string | null, root: string): void;
interface ImageCandidate {
    url: string;
    descriptor: string;
}
export declare function processSrcSet(srcs: string, replacer: (arg: ImageCandidate) => Promise<string>): Promise<string>;
export declare function combineSourcemaps(filename: string, sourcemapList: Array<DecodedSourceMap | RawSourceMap>): RawSourceMap;
export declare function unique<T>(arr: T[]): T[];
export interface Hostname {
    host: string | undefined;
    name: string;
}
export declare function resolveHostname(optionsHost: string | boolean | undefined): Hostname;
export declare function arraify<T>(target: T | T[]): T[];
export declare function toUpperCaseDriveLetter(pathName: string): string;
export declare const multilineCommentsRE: RegExp;
export declare const singlelineCommentsRE: RegExp;
export declare const usingDynamicImport: boolean;
/**
 * Dynamically import files. It will make sure it's not being compiled away by TS/Rollup.
 *
 * As a temporary workaround for Jest's lack of stable ESM support, we fallback to require
 * if we're in a Jest environment.
 * See https://github.com/vitejs/vite/pull/5197#issuecomment-938054077
 *
 * @param file File path to import.
 */
export declare const dynamicImport: Function;
export {};
