import { sql as _sql } from 'drizzle-orm';
function createColumn(type, schema) {
	return {
		type,
		/**
		 * @internal
		 */
		schema,
	};
}
const column = {
	number: (opts = {}) => {
		return createColumn('number', opts);
	},
	boolean: (opts = {}) => {
		return createColumn('boolean', opts);
	},
	text: (opts = {}) => {
		return createColumn('text', opts);
	},
	date(opts = {}) {
		return createColumn('date', opts);
	},
	json(opts = {}) {
		return createColumn('json', opts);
	},
};
function defineTable(userConfig) {
	return userConfig;
}
function defineDb(userConfig) {
	return userConfig;
}
const NOW = _sql`CURRENT_TIMESTAMP`;
const TRUE = _sql`TRUE`;
const FALSE = _sql`FALSE`;
import {
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
import { alias } from 'drizzle-orm/sqlite-core';
import { getDbError, isDbError } from './utils.js';
export {
	FALSE,
	NOW,
	TRUE,
	alias,
	and,
	asc,
	avg,
	avgDistinct,
	between,
	column,
	count,
	countDistinct,
	defineDb,
	defineTable,
	desc,
	eq,
	exists,
	getDbError,
	gt,
	gte,
	ilike,
	inArray,
	isDbError,
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
};
