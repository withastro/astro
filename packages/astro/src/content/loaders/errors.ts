import type { StandardSchemaV1 } from '@standard-schema/spec';
import { formatSchemaIssues } from '../../core/errors/standard-schema.js';

export class LiveCollectionError extends Error {
	public readonly collection: string;
	public readonly message: string;
	public readonly cause?: Error;

	constructor(collection: string, message: string, cause?: Error) {
		super(message);
		this.collection = collection;
		this.message = message;
		this.cause = cause;
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
	constructor(collection: string, entryId: string, issues: readonly StandardSchemaV1.Issue[]) {
		super(
			collection,
			[
				`**${collection} → ${entryId}** data does not match the collection schema.\n`,
				...formatSchemaIssues(issues),
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
	constructor(
		collection: string,
		entryId: string | undefined,
		issues: readonly StandardSchemaV1.Issue[],
	) {
		super(
			collection,
			[
				`**${String(collection)}${entryId ? ` → ${String(entryId)}` : ''}** returned an invalid cache hint.\n`,
				...formatSchemaIssues(issues),
				'',
			].join('\n'),
		);
		this.name = 'LiveCollectionCacheHintError';
	}
	static is(error: unknown): error is LiveCollectionCacheHintError {
		return (error as any)?.name === 'LiveCollectionCacheHintError';
	}
}
