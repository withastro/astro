import { sql as _sql } from 'drizzle-orm';
import type {
	BooleanColumnInput,
	ColumnsConfig,
	DBConfigInput,
	DateColumnInput,
	JsonColumnInput,
	NumberColumnOpts,
	TableConfig,
	TextColumnOpts,
} from '../core/types.js';

function createColumn<const S extends string, T extends Record<string, unknown>>(type: S, schema: T) {
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
		return createColumn('number', opts);
	},
	boolean: <T extends BooleanColumnInput['schema']>(opts: T = {} as T) => {
		return createColumn('boolean', opts);
	},
	text: <T extends TextColumnOpts>(opts: T = {} as T) => {
		return createColumn('text', opts);
	},
	date<T extends DateColumnInput['schema']>(opts: T = {} as T) {
		return createColumn('date', opts);
	},
	json<T extends JsonColumnInput['schema']>(opts: T = {} as T) {
		return createColumn('json', opts);
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
	sql,
	eq,
	gt,
	gte,
	lt,
	lte,
	ne,
	isNull,
	isNotNull,
	inArray,
	notInArray,
	exists,
	notExists,
	between,
	notBetween,
	like,
	ilike,
	notIlike,
	not,
	asc,
	desc,
	and,
	or,
	count,
	countDistinct,
	avg,
	avgDistinct,
	sum,
	sumDistinct,
	max,
	min,
} from 'drizzle-orm';

export { alias } from 'drizzle-orm/sqlite-core';
export { isDbError } from './utils.js';
