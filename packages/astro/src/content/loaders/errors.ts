import type * as z from 'zod/v4/core';

function formatZodError(error: z.$ZodError): string[] {
	return error.issues.map((issue) => `  **${issue.path.join('.')}**: ${issue.message}`);
}

export class LiveCollectionError extends Error {
	constructor(
		public readonly collection: string,
		public readonly message: string,
		public readonly cause?: Error,
	) {
		super(message);
		this.name = 'LiveCollectionError';
		if (cause?.stack) {
			this.stack = cause.stack;
		}
	}
	static is(error: unknown): error is LiveCollectionError {
		return error instanceof LiveCollectionError;
	}
}

export class LiveEntryNotFoundError extends LiveCollectionError {
	constructor(collection: string, entryFilter: string | Record<string, unknown>) {
		super(
			collection,
			`Entry ${collection} → ${typeof entryFilter === 'string' ? entryFilter : JSON.stringify(entryFilter)} was not found.`,
		);
		this.name = 'LiveEntryNotFoundError';
	}
	static is(error: unknown): error is LiveEntryNotFoundError {
		return (error as any)?.name === 'LiveEntryNotFoundError';
	}
}

export class LiveCollectionValidationError extends LiveCollectionError {
	constructor(collection: string, entryId: string, error: z.$ZodError) {
		super(
			collection,
			[
				`**${collection} → ${entryId}** data does not match the collection schema.\n`,
				...formatZodError(error),
				'',
			].join('\n'),
		);
		this.name = 'LiveCollectionValidationError';
	}
	static is(error: unknown): error is LiveCollectionValidationError {
		return (error as any)?.name === 'LiveCollectionValidationError';
	}
}

export class LiveCollectionCacheHintError extends LiveCollectionError {
	constructor(collection: string, entryId: string | undefined, error: z.$ZodError) {
		super(
			collection,
			[
				`**${String(collection)}${entryId ? ` → ${String(entryId)}` : ''}** returned an invalid cache hint.\n`,
				...formatZodError(error),
				'',
			].join('\n'),
		);
		this.name = 'LiveCollectionCacheHintError';
	}
	static is(error: unknown): error is LiveCollectionCacheHintError {
		return (error as any)?.name === 'LiveCollectionCacheHintError';
	}
}
