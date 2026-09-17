import type { SqlValue } from './types.js';

/** Quotes a SQL identifier (table or column name). */
export function quoteIdentifier(name: string): string {
	return `"${name.replaceAll('"', '""')}"`;
}

/** Returns the SQL literal for a value, for statements that cannot use bound parameters. */
export function sqlLiteral(value: SqlValue): string {
	if (value === null) return 'NULL';
	if (typeof value === 'number') {
		if (!Number.isFinite(value))
			throw new Error(`Cannot store non-finite number ${value} in SQLite`);
		return String(value);
	}
	return `'${value.replaceAll("'", "''")}'`;
}

/** The table that mirrors a content collection. */
export function tableName(tablePrefix: string, collection: string): string {
	return `${tablePrefix}${collection}`;
}

/**
 * Normalizes a JavaScript value into something SQLite can compare against the
 * result of `json_extract()`: dates become ISO strings, booleans become 1/0.
 */
export function toSqlValue(value: unknown): SqlValue {
	if (value === null || value === undefined) return null;
	if (value instanceof Date) return value.toISOString();
	if (typeof value === 'boolean') return value ? 1 : 0;
	if (typeof value === 'number' || typeof value === 'string') return value;
	if (typeof value === 'bigint') return value.toString();
	throw new TypeError(`Unsupported value in query: ${describe(value)}`);
}

function describe(value: unknown) {
	if (Array.isArray(value)) return 'array';
	if (typeof value === 'object') return 'object';
	return typeof value;
}

const SAFE_JSON_KEY = /^[A-Za-z_$][\w$]*$/;

/**
 * Builds a SQLite JSON path (`$.a.b[0]`) from a list of keys. The path is always
 * bound as a parameter, so this only has to produce valid JSON path syntax.
 */
export function jsonPath(keys: ReadonlyArray<string | number>): string {
	let path = '$';
	for (const key of keys) {
		if (typeof key === 'number') {
			path += `[${key}]`;
		} else if (SAFE_JSON_KEY.test(key)) {
			path += `.${key}`;
		} else if (key.includes('"')) {
			throw new Error(`Cannot query field "${key}": field names must not contain double quotes`);
		} else {
			path += `."${key}"`;
		}
	}
	return path;
}
