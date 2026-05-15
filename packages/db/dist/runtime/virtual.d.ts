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
export declare const column: {
	number: <T extends NumberColumnOpts>(
		opts?: T,
	) => {
		type: 'number';
		/**
		 * @internal
		 */
		schema: T;
	};
	boolean: <T extends BooleanColumnInput['schema']>(
		opts?: T,
	) => {
		type: 'boolean';
		/**
		 * @internal
		 */
		schema: T;
	};
	text: <
		T extends TextColumnOpts,
		const E extends T['enum'] extends readonly [string, ...string[]]
			? Omit<T, 'enum'> & T['enum']
			: T,
	>(
		opts?: E,
	) => {
		type: 'text';
		/**
		 * @internal
		 */
		schema: E;
	};
	date<T extends DateColumnInput['schema']>(
		opts?: T,
	): {
		type: 'date';
		/**
		 * @internal
		 */
		schema: T;
	};
	json<T extends JsonColumnInput['schema']>(
		opts?: T,
	): {
		type: 'json';
		/**
		 * @internal
		 */
		schema: T;
	};
};
export declare function defineTable<TColumns extends ColumnsConfig>(
	userConfig: TableConfig<TColumns>,
): TableConfig<TColumns>;
export declare function defineDb(userConfig: DBConfigInput): {
	tables?: unknown;
};
export declare const NOW: import('drizzle-orm').SQL<unknown>;
export declare const TRUE: import('drizzle-orm').SQL<unknown>;
export declare const FALSE: import('drizzle-orm').SQL<unknown>;
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
export { getDbError, isDbError } from './utils.js';
