import { sql as _sql } from 'drizzle-orm';
import type {
	BooleanColumnInput,
	ColumnsConfig,
	DateColumnInput,
	DBConfigInput,
	JsonColumnInput,
	NumberColumnOpts,
	TableConfig,
	TextColumnOpts,
} from '../core/types.js';

function createColumn<S extends string, T extends Record<string, unknown>>(type: S, schema: T) {
	return {
		type,
		/**
		 * @internal
		 */
		schema,
	};
}

export const column = {
	number: <T extends NumberColumnOpts>(opts: T = {} as T) => {
		return createColumn('number', opts) satisfies { type: 'number' };
	},
	boolean: <T extends BooleanColumnInput['schema']>(opts: T = {} as T) => {
		return createColumn('boolean', opts) satisfies { type: 'boolean' };
	},
	text: <
		T extends TextColumnOpts,
		const E extends T['enum'] extends readonly [string, ...string[]]
			? Omit<T, 'enum'> & T['enum']
			: T,
	>(
		opts: E = {} as E,
	) => {
		return createColumn('text', opts) satisfies { type: 'text' };
	},
	date<T extends DateColumnInput['schema']>(opts: T = {} as T) {
		return createColumn('date', opts) satisfies { type: 'date' };
	},
	json<T extends JsonColumnInput['schema']>(opts: T = {} as T) {
		return createColumn('json', opts) satisfies { type: 'json' };
	},
};

export function defineTable<TColumns extends ColumnsConfig>(userConfig: TableConfig<TColumns>) {
	return userConfig;
}

export function defineDb(userConfig: DBConfigInput) {
	return userConfig;
}

// Exports a few common expressions
export const NOW = _sql`CURRENT_TIMESTAMP`;
export const TRUE = _sql`TRUE`;
export const FALSE = _sql`FALSE`;

export {
	and,
	asc,
	avg,
	avgDistinct,
	between,
	count,
	countDistinct,
	desc,
	eq,
	exists,
	gt,
	gte,
	ilike,
	inArray,
	isNotNull,
	isNull,
	like,
	lt,
	lte,
	max,
	min,
	ne,
	not,
	notBetween,
	notExists,
	notIlike,
	notInArray,
	or,
	sql,
	sum,
	sumDistinct,
} from 'drizzle-orm';

export { alias } from 'drizzle-orm/sqlite-core';
export { isDbError } from './utils.js';
