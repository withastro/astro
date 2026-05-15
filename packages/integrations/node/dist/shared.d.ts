import type { NodeAppHeadersJson, Options } from './types.js';
export declare const STATIC_HEADERS_FILE = '_headers.json';
/**
 * Resolves the client directory path at runtime.
 *
 * At build time, we know the relative path between server and client directories.
 * At runtime, we need to find the actual location based on where the server entry is running.
 *
 * ## Error
 *
 * It throws an error if it can't find the directory while walking the parent directories.
 */
export declare function resolveClientDir(options: Options): string;
export declare function readHeadersJson(outDir: string | URL): NodeAppHeadersJson | undefined;
