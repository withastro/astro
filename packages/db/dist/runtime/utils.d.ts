import { LibsqlError } from '@libsql/client';
import { AstroError } from 'astro/errors';
import type { DBColumn } from '../core/types.js';
export declare function hasPrimaryKey(column: DBColumn): boolean;
export declare class AstroDbError extends AstroError {
	name: string;
}
export declare function getDbError(err: unknown): LibsqlError | undefined;
export declare function isDbError(err: unknown): boolean;
export declare function pathToFileURL(path: string): URL;
