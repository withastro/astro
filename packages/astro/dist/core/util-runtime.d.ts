/**
 * Runtime-agnostic utility functions that can be used in any environment.
 * These functions must not import Node.js modules.
 */
/** Returns true if argument is an object of any prototype/class (but not null). */
export declare function isObject(value: unknown): value is Record<string, any>;
/** Cross-realm compatible URL */
export declare function isURL(value: unknown): value is URL;
/** Wraps an object in an array. If an array is passed, ignore it. */
export declare function arraify<T>(target: T | T[]): T[];
export declare function padMultilineString(source: string, n?: number): string;
