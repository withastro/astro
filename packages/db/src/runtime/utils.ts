import { LibsqlError } from '@libsql/client';
import { AstroError } from 'astro/errors';
import type { DBColumn } from '../core/types.js';

export function hasPrimaryKey(column: DBColumn) {
	return 'primaryKey' in column.schema && !!column.schema.primaryKey;
}

const isWindows = process?.platform === 'win32';

export class AstroDbError extends AstroError {
	name = 'Astro DB Error';
}

// Walks the .cause chain to find the underlying LibsqlError, unwrapping drizzle-orm's
// DrizzleQueryError (introduced in 0.44). Returns the LibsqlError directly so callers
// can read .code and .message without caring whether the outer error was wrapped.
// Prefer this over isDbError when accessing libSQL-specific properties; on a wrapped
// error the outer object has a "Failed query: ..." message and no .code field.
export function getDbError(err: unknown): LibsqlError | undefined {
	if (err instanceof LibsqlError) return err;
	if (err instanceof Error && (err as any).libsqlError === true) return err as LibsqlError;
	if (err instanceof Error && err.cause != null && err.cause !== err) {
		return getDbError(err.cause);
	}
	return undefined;
}

// Reports whether a caught error was (directly or transitively) caused by libSQL.
// NOTE: this returns a plain boolean rather than a `err is LibsqlError` type predicate
// because drizzle-orm 0.44+ wraps query errors in a DrizzleQueryError whose .cause is
// the real LibsqlError; narrowing `err` to LibsqlError would be a lie at runtime and
// would silently give `undefined` for .code and the wrong .message on wrapped errors.
// Use getDbError() to obtain the unwrapped LibsqlError for property access.
export function isDbError(err: unknown): boolean {
	return getDbError(err) !== undefined;
}

function slash(path: string) {
	const isExtendedLengthPath = path.startsWith('\\\\?\\');

	if (isExtendedLengthPath) {
		return path;
	}

	return path.replace(/\\/g, '/');
}

export function pathToFileURL(path: string): URL {
	if (isWindows) {
		let slashed = slash(path);
		// Windows like C:/foo/bar
		if (!slashed.startsWith('/')) {
			slashed = '/' + slashed;
		}
		return new URL('file://' + slashed);
	}

	// Unix is easy
	return new URL('file://' + path);
}
