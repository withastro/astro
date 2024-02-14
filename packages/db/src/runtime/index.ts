import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';
import { type DBCollection, type DBField } from '../core/types.js';
import { type ColumnBuilderBaseConfig, type ColumnDataType, sql, SQL } from 'drizzle-orm';
import {
	customType,
	integer,
	sqliteTable,
	text,
	index,
	type SQLiteColumnBuilderBase,
	type IndexBuilder,
} from 'drizzle-orm/sqlite-core';
import { z } from 'zod';
import { isSerializedSQL, type SerializedSQL } from './types.js';

export { sql };
export type SqliteDB = SqliteRemoteDatabase;
export type { Table } from './types.js';
export { createRemoteDatabaseClient, createLocalDatabaseClient } from './db-client.js';

export function hasPrimaryKey(field: DBField) {
	return 'primaryKey' in field.schema && !!field.schema.primaryKey;
}

// Exports a few common expressions
export const NOW = sql`CURRENT_TIMESTAMP`;
export const TRUE = sql`TRUE`;
export const FALSE = sql`FALSE`;

const dateType = customType<{ data: Date; driverData: string }>({
	dataType() {
		return 'text';
	},
	toDriver(value) {
		return value.toISOString();
	},
	fromDriver(value) {
		console.log('driver', value);
		return new Date(value);
	},
});

const jsonType = customType<{ data: unknown; driverData: string }>({
	dataType() {
		return 'text';
	},
	toDriver(value) {
		return JSON.stringify(value);
	},
	fromDriver(value) {
		return JSON.parse(value);
	},
});

type D1ColumnBuilder = SQLiteColumnBuilderBase<
	ColumnBuilderBaseConfig<ColumnDataType, string> & { data: unknown }
>;

export function collectionToTable(name: string, collection: DBCollection) {
	const columns: Record<string, D1ColumnBuilder> = {};
	if (!Object.entries(collection.fields).some(([, field]) => hasPrimaryKey(field))) {
		columns['_id'] = integer('_id').primaryKey();
	}
	for (const [fieldName, field] of Object.entries(collection.fields)) {
		columns[fieldName] = columnMapper(fieldName, field);
	}
	const table = sqliteTable(name, columns, (ormTable) => {
		const indexes: Record<string, IndexBuilder> = {};
		for (const [indexName, indexProps] of Object.entries(collection.indexes ?? {})) {
			const onColNames = Array.isArray(indexProps.on) ? indexProps.on : [indexProps.on];
			const onCols = onColNames.map((colName) => ormTable[colName]);
			if (!atLeastOne(onCols)) continue;

			indexes[indexName] = index(indexName).on(...onCols);
		}
		return indexes;
	});
	return table;
}

function atLeastOne<T>(arr: T[]): arr is [T, ...T[]] {
	return arr.length > 0;
}

function columnMapper(fieldName: string, field: DBField) {
	let c: ReturnType<
		| typeof text
		| typeof integer
		| typeof jsonType
		| typeof dateType
		| typeof integer<string, 'boolean'>
	>;

	switch (field.type) {
		case 'text': {
			c = text(fieldName);
			// Duplicate default logic across cases to preserve type inference.
			// No clean generic for every column builder.
			if (field.schema.default !== undefined)
				c = c.default(handleSerializedSQL(field.schema.default));
			if (field.schema.primaryKey === true) c = c.primaryKey();
			break;
		}
		case 'number': {
			c = integer(fieldName);
			if (field.schema.default !== undefined)
				c = c.default(handleSerializedSQL(field.schema.default));
			if (field.schema.primaryKey === true) c = c.primaryKey();
			break;
		}
		case 'boolean': {
			c = integer(fieldName, { mode: 'boolean' });
			if (field.schema.default !== undefined)
				c = c.default(handleSerializedSQL(field.schema.default));
			break;
		}
		case 'json':
			c = jsonType(fieldName);
			if (field.schema.default !== undefined) c = c.default(field.schema.default);
			break;
		case 'date': {
			c = dateType(fieldName);
			if (field.schema.default !== undefined) {
				const def = handleSerializedSQL(field.schema.default);
				c = c.default(typeof def === 'string' ? new Date(def) : def);
			}
			break;
		}
	}

	if (!field.schema.optional) c = c.notNull();
	if (field.schema.unique) c = c.unique();
	return c;
}

function handleSerializedSQL<T>(def: T | SerializedSQL) {
	if (isSerializedSQL(def)) {
		return sql.raw(def.sql);
	}
	return def;
}
