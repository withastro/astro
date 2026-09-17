import { jsonPath, quoteIdentifier, tableName, toSqlValue } from './sql.js';
import { META_TABLE, type SqlValue } from './types.js';

type Scalar = string | number | boolean | Date | null;

/** Operators available on scalar fields (strings, numbers, booleans, dates). */
export interface ScalarOperators<T> {
	eq?: T | null;
	ne?: T | null;
	gt?: T;
	gte?: T;
	lt?: T;
	lte?: T;
	in?: T[];
	notIn?: T[];
	/** SQL `LIKE` pattern, `%` and `_` are wildcards. */
	like?: string;
	startsWith?: string;
	endsWith?: string;
	contains?: string;
	isNull?: boolean;
}

/** Operators available on array fields. */
export interface ArrayOperators<T> {
	/** The array contains this value. */
	includes?: T;
	/** The array contains at least one of these values. */
	includesAny?: T[];
	/** The array contains every one of these values. */
	includesAll?: T[];
	isEmpty?: boolean;
}

export type Condition<T> = [NonNullable<T>] extends [Scalar]
	? NonNullable<T> | ScalarOperators<NonNullable<T>> | null
	: NonNullable<T> extends ReadonlyArray<infer U>
		? ArrayOperators<U>
		: NonNullable<T> extends Record<string, any>
			? Where<NonNullable<T>>
			: never;

export type Where<TData extends Record<string, any>> = {
	[K in keyof TData]?: Condition<TData[K]>;
} & {
	AND?: Array<Where<TData>>;
	OR?: Array<Where<TData>>;
	NOT?: Where<TData>;
};

export type SortDirection = 'asc' | 'desc';

/** Keys of the data, or `id`, or a dotted path (`author.name`) into nested data. */
export type FieldPath<TData extends Record<string, any>> = keyof TData | 'id' | (string & {});

export type OrderBy<TData extends Record<string, any>> =
	| Partial<Record<FieldPath<TData>, SortDirection>>
	| Array<Partial<Record<FieldPath<TData>, SortDirection>>>;

/** The filter accepted by `getLiveCollection()`. */
export interface CollectionFilter<TData extends Record<string, any> = Record<string, any>> {
	/** Only load these top-level fields of `data`. Everything else is left out of the returned entries. */
	select?: Array<keyof TData & string>;
	where?: Where<TData & { id: string }>;
	orderBy?: OrderBy<TData>;
	limit?: number;
	offset?: number;
	/** Include the rendered HTML of each entry. Off by default, as it makes list queries much heavier. */
	rendered?: boolean;
}

/** The filter accepted by `getLiveEntry()`, on top of a plain string ID. */
export type EntryFilter<TData extends Record<string, any> = Record<string, any>> =
	| { id: string }
	| {
			where: Where<TData & { id: string }>;
			orderBy?: OrderBy<TData>;
			select?: Array<keyof TData & string>;
	  };

export interface CompiledQuery {
	sql: string;
	params: SqlValue[];
}

const SCALAR_OPERATORS = new Set([
	'eq',
	'ne',
	'gt',
	'gte',
	'lt',
	'lte',
	'in',
	'notIn',
	'like',
	'startsWith',
	'endsWith',
	'contains',
	'isNull',
]);
const ARRAY_OPERATORS = new Set(['includes', 'includesAny', 'includesAll', 'isEmpty']);
const LOGICAL_OPERATORS = new Set(['AND', 'OR', 'NOT']);

class QueryBuilder {
	params: SqlValue[] = [];

	bind(value: unknown): string {
		this.params.push(toSqlValue(value));
		return '?';
	}

	bindRaw(value: SqlValue): string {
		this.params.push(value);
		return '?';
	}

	/** The SQL expression that reads a field: the `id` column, or a JSON path into `data`. */
	column(keys: ReadonlyArray<string | number>): string {
		if (keys.length === 1 && keys[0] === 'id') {
			return '"id"';
		}
		return `json_extract("data", ${this.bindRaw(jsonPath(keys))})`;
	}

	where(where: Record<string, unknown>, prefix: ReadonlyArray<string | number>): string[] {
		const clauses: string[] = [];
		for (const [key, condition] of Object.entries(where)) {
			if (condition === undefined) continue;
			if (prefix.length === 0 && LOGICAL_OPERATORS.has(key)) {
				clauses.push(this.logical(key, condition));
				continue;
			}
			const keys = [...prefix, ...splitPath(key)];
			if (condition === null) {
				clauses.push(`${this.column(keys)} IS NULL`);
			} else if (isPlainObject(condition)) {
				const operators = Object.keys(condition);
				if (operators.every((op) => SCALAR_OPERATORS.has(op) || ARRAY_OPERATORS.has(op))) {
					clauses.push(...this.operators(keys, condition));
				} else {
					clauses.push(...this.where(condition, keys));
				}
			} else if (Array.isArray(condition)) {
				throw new Error(
					`Invalid condition for "${keys.join('.')}": use { includes }, { includesAny } or { includesAll } to filter array fields, or { in } to match one of several values`,
				);
			} else {
				clauses.push(`${this.column(keys)} = ${this.bind(condition)}`);
			}
		}
		return clauses;
	}

	logical(operator: string, condition: unknown): string {
		if (operator === 'NOT') {
			if (!isPlainObject(condition)) throw new Error('NOT expects an object');
			return `NOT (${joinAnd(this.where(condition, []))})`;
		}
		if (!Array.isArray(condition)) throw new Error(`${operator} expects an array of conditions`);
		const groups = condition.map((item) => {
			if (!isPlainObject(item)) throw new Error(`${operator} expects an array of objects`);
			return `(${joinAnd(this.where(item, []))})`;
		});
		if (groups.length === 0) return operator === 'OR' ? '0' : '1';
		return `(${groups.join(operator === 'OR' ? ' OR ' : ' AND ')})`;
	}

	operators(keys: ReadonlyArray<string | number>, operators: Record<string, unknown>): string[] {
		const clauses: string[] = [];
		for (const [operator, value] of Object.entries(operators)) {
			if (value === undefined) continue;
			const field = keys.join('.');
			switch (operator) {
				case 'eq':
					clauses.push(
						value === null
							? `${this.column(keys)} IS NULL`
							: `${this.column(keys)} = ${this.bind(value)}`,
					);
					break;
				case 'ne':
					clauses.push(
						value === null
							? `${this.column(keys)} IS NOT NULL`
							: `${this.column(keys)} IS NOT ${this.bind(value)}`,
					);
					break;
				case 'gt':
					clauses.push(`${this.column(keys)} > ${this.bind(value)}`);
					break;
				case 'gte':
					clauses.push(`${this.column(keys)} >= ${this.bind(value)}`);
					break;
				case 'lt':
					clauses.push(`${this.column(keys)} < ${this.bind(value)}`);
					break;
				case 'lte':
					clauses.push(`${this.column(keys)} <= ${this.bind(value)}`);
					break;
				case 'in':
				case 'notIn': {
					const values = expectArray(value, field, operator);
					if (values.length === 0) {
						clauses.push(operator === 'in' ? '0' : '1');
						break;
					}
					const column = this.column(keys);
					const list = values.map((item) => this.bind(item)).join(', ');
					clauses.push(`${column} ${operator === 'in' ? 'IN' : 'NOT IN'} (${list})`);
					break;
				}
				case 'like':
					clauses.push(
						`${this.column(keys)} LIKE ${this.bind(expectString(value, field, operator))}`,
					);
					break;
				case 'startsWith':
					clauses.push(
						`${this.column(keys)} LIKE ${this.bind(`${escapeLike(expectString(value, field, operator))}%`)} ESCAPE '\\'`,
					);
					break;
				case 'endsWith':
					clauses.push(
						`${this.column(keys)} LIKE ${this.bind(`%${escapeLike(expectString(value, field, operator))}`)} ESCAPE '\\'`,
					);
					break;
				case 'contains':
					clauses.push(
						`${this.column(keys)} LIKE ${this.bind(`%${escapeLike(expectString(value, field, operator))}%`)} ESCAPE '\\'`,
					);
					break;
				case 'isNull':
					clauses.push(`${this.column(keys)} IS ${value ? '' : 'NOT '}NULL`);
					break;
				case 'includes':
					clauses.push(
						`EXISTS (SELECT 1 FROM json_each("data", ${this.bindRaw(jsonPath(keys))}) WHERE json_each.value = ${this.bind(value)})`,
					);
					break;
				case 'includesAny': {
					const values = expectArray(value, field, operator);
					if (values.length === 0) {
						clauses.push('0');
						break;
					}
					const path = this.bindRaw(jsonPath(keys));
					const list = values.map((item) => this.bind(item)).join(', ');
					clauses.push(
						`EXISTS (SELECT 1 FROM json_each("data", ${path}) WHERE json_each.value IN (${list}))`,
					);
					break;
				}
				case 'includesAll': {
					const values = [...new Set(expectArray(value, field, operator))];
					if (values.length === 0) {
						clauses.push('1');
						break;
					}
					const path = this.bindRaw(jsonPath(keys));
					const list = values.map((item) => this.bind(item)).join(', ');
					clauses.push(
						`(SELECT count(DISTINCT json_each.value) FROM json_each("data", ${path}) WHERE json_each.value IN (${list})) = ${values.length}`,
					);
					break;
				}
				case 'isEmpty':
					clauses.push(
						value
							? `coalesce(json_array_length("data", ${this.bindRaw(jsonPath(keys))}), 0) = 0`
							: `json_array_length("data", ${this.bindRaw(jsonPath(keys))}) > 0`,
					);
					break;
				default:
					throw new Error(`Unknown operator "${operator}" for field "${field}"`);
			}
		}
		return clauses;
	}

	orderBy(orderBy: OrderBy<any> | undefined): string {
		const entries = (Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : []).flatMap((item) =>
			Object.entries(item),
		);
		const terms = entries
			.filter(([, direction]) => direction !== undefined)
			.map(([key, direction]) => {
				if (direction !== 'asc' && direction !== 'desc') {
					throw new Error(
						`Invalid sort direction "${direction}" for "${key}": expected "asc" or "desc"`,
					);
				}
				return `${this.column(splitPath(key))} ${direction === 'asc' ? 'ASC' : 'DESC'}`;
			});
		// Always break ties by ID so results are stable across drivers.
		terms.push('"id" ASC');
		return `ORDER BY ${terms.join(', ')}`;
	}

	/** The expression that produces the `data` column, either whole or projected to the selected fields. */
	select(select: string[] | undefined): string {
		if (!select) return '"data"';
		if (select.length === 0) return "'{}'";
		const pairs = select.map(
			(key) => `${this.bindRaw(key)}, "data"->${this.bindRaw(jsonPath([key]))}`,
		);
		return `json_object(${pairs.join(', ')})`;
	}
}

interface CompileOptions {
	tablePrefix: string;
	collection: string;
}

export function compileCollectionQuery(
	{ tablePrefix, collection }: CompileOptions,
	filter: CollectionFilter<any> = {},
): CompiledQuery {
	const builder = new QueryBuilder();
	const columns = ['"id"', `${builder.select(filter.select)} AS "data"`, '"meta"'];
	if (filter.rendered) columns.push('"rendered"');
	const clauses = filter.where ? builder.where(filter.where, []) : [];
	let sql = `SELECT ${columns.join(', ')} FROM ${quoteIdentifier(tableName(tablePrefix, collection))}`;
	if (clauses.length > 0) sql += ` WHERE ${joinAnd(clauses)}`;
	sql += ` ${builder.orderBy(filter.orderBy)}`;
	if (filter.limit !== undefined || filter.offset !== undefined) {
		sql += ` LIMIT ${builder.bindRaw(expectInteger(filter.limit ?? -1, 'limit'))}`;
		if (filter.offset !== undefined)
			sql += ` OFFSET ${builder.bindRaw(expectInteger(filter.offset, 'offset'))}`;
	}
	return { sql, params: builder.params };
}

export function compileEntryQuery(
	{ tablePrefix, collection }: CompileOptions,
	filter: EntryFilter<any>,
): CompiledQuery {
	const builder = new QueryBuilder();
	const select = 'select' in filter ? filter.select : undefined;
	const columns = ['"id"', `${builder.select(select)} AS "data"`, '"meta"', '"rendered"'];
	const where = 'where' in filter ? filter.where : { id: filter.id };
	const clauses = builder.where(where, []);
	let sql = `SELECT ${columns.join(', ')} FROM ${quoteIdentifier(tableName(tablePrefix, collection))}`;
	if (clauses.length > 0) sql += ` WHERE ${joinAnd(clauses)}`;
	sql += ` ${builder.orderBy('orderBy' in filter ? filter.orderBy : undefined)} LIMIT 1`;
	return { sql, params: builder.params };
}

export function compileLastModifiedQuery(collection: string): CompiledQuery {
	return {
		sql: `SELECT "value" FROM ${quoteIdentifier(META_TABLE)} WHERE "key" = ?`,
		params: [lastModifiedKey(collection)],
	};
}

export function lastModifiedKey(collection: string) {
	return `collection:${collection}:lastModified`;
}

/** The shape of the `meta` column stored next to each entry. */
export interface EntryMeta {
	/** Paths (as key lists) of `data` fields that hold a `Date`, so they can be revived after a round trip through JSON. */
	dates?: Array<Array<string | number>>;
}

export interface HydratedRow {
	id: string;
	data: Record<string, unknown>;
	rendered?: { html: string };
}

/** Turns a row returned by one of the compiled queries back into entry data. */
export function hydrateRow(row: Record<string, unknown>): HydratedRow {
	const data = JSON.parse(String(row.data)) as Record<string, unknown>;
	const meta = (row.meta ? JSON.parse(String(row.meta)) : {}) as EntryMeta;
	for (const path of meta.dates ?? []) {
		reviveDate(data, path);
	}
	const hydrated: HydratedRow = { id: String(row.id), data };
	if (typeof row.rendered === 'string') {
		hydrated.rendered = { html: row.rendered };
	}
	return hydrated;
}

function reviveDate(root: unknown, path: Array<string | number>) {
	let parent: any = root;
	for (let i = 0; i < path.length - 1; i++) {
		if (parent === null || typeof parent !== 'object') return;
		parent = parent[path[i]];
	}
	const key = path[path.length - 1];
	if (parent && typeof parent === 'object' && typeof parent[key] === 'string') {
		parent[key] = new Date(parent[key]);
	}
}

function splitPath(key: string): string[] {
	return key.split('.');
}

function joinAnd(clauses: string[]): string {
	return clauses.length === 0 ? '1' : clauses.join(' AND ');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (
		value === null ||
		typeof value !== 'object' ||
		Array.isArray(value) ||
		value instanceof Date
	) {
		return false;
	}
	const proto = Object.getPrototypeOf(value);
	return proto === null || proto === Object.prototype;
}

function expectArray(value: unknown, field: string, operator: string): unknown[] {
	if (!Array.isArray(value)) throw new Error(`"${operator}" on "${field}" expects an array`);
	return value;
}

function expectString(value: unknown, field: string, operator: string): string {
	if (typeof value !== 'string') throw new Error(`"${operator}" on "${field}" expects a string`);
	return value;
}

function expectInteger(value: unknown, name: string): number {
	if (typeof value !== 'number' || !Number.isInteger(value)) {
		throw new Error(`"${name}" must be an integer`);
	}
	return value;
}

function escapeLike(value: string): string {
	return value.replaceAll(/[\\%_]/g, (char) => `\\${char}`);
}
