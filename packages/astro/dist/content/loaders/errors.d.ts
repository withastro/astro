import type * as z from 'zod/v4/core';
export declare class LiveCollectionError extends Error {
	readonly collection: string;
	readonly message: string;
	readonly cause?: Error;
	constructor(collection: string, message: string, cause?: Error);
	static is(error: unknown): error is LiveCollectionError;
}
export declare class LiveEntryNotFoundError extends LiveCollectionError {
	constructor(collection: string, entryFilter: string | Record<string, unknown>);
	static is(error: unknown): error is LiveEntryNotFoundError;
}
export declare class LiveCollectionValidationError extends LiveCollectionError {
	constructor(collection: string, entryId: string, error: z.$ZodError);
	static is(error: unknown): error is LiveCollectionValidationError;
}
export declare class LiveCollectionCacheHintError extends LiveCollectionError {
	constructor(collection: string, entryId: string | undefined, error: z.$ZodError);
	static is(error: unknown): error is LiveCollectionCacheHintError;
}
