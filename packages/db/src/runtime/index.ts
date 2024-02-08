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

export { sql };
export type SqliteDB = SqliteRemoteDatabase;
export type { Table } from './types.js';
export { createRemoteDatabaseClient, createLocalDatabaseClient } from './db-client.js';

export function hasPrimaryKey(field: DBField) {
	return 'primaryKey' in field && !!field.primaryKey;
}

// Exports a few common expressions
export const NOW = sql`CURRENT_TIMESTAMP`;
export const TRUE = sql`TRUE`;
export const FALSE = sql`FALSE`

const dateType = customType<{ data: Date; driverData: string }>({
	dataType() {
		return 'text';
	},
	toDriver(value) {
		return value.toISOString();
	},
	fromDriver(value) {
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

export function collectionToTable(
	name: string,
	collection: DBCollection,
	isJsonSerializable = true
) {
	const columns: Record<string, D1ColumnBuilder> = {};
	if (!Object.entries(collection.fields).some(([, field]) => hasPrimaryKey(field))) {
		columns['_id'] = integer('_id').primaryKey();
	}
	for (const [fieldName, field] of Object.entries(collection.fields)) {
		columns[fieldName] = columnMapper(fieldName, field, isJsonSerializable);
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

function columnMapper(fieldName: string, field: DBField, isJsonSerializable: boolean) {
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
			if (field.default !== undefined) c = c.default(field.default);
			if (field.primaryKey === true) c = c.primaryKey();
			break;
		}
		case 'number': {
			c = integer(fieldName);
			if (field.default !== undefined) c = c.default(field.default);
			if (field.primaryKey === true) c = c.primaryKey({ autoIncrement: true });
			break;
		}
		case 'boolean': {
			c = integer(fieldName, { mode: 'boolean' });
			if (field.default !== undefined) c = c.default(field.default);
			break;
		}
		case 'json':
			c = jsonType(fieldName);
			if (field.default !== undefined) c = c.default(field.default);
			break;
		case 'date': {
			// Parse dates as strings when in JSON serializable mode
			if (isJsonSerializable) {
				c = text(fieldName);
				if (field.default !== undefined) {
					c = c.default(field.default);
				}
			} else {
				c = dateType(fieldName);
				if (field.default !== undefined) {
					const def = convertSerializedSQL(field.default);
					c = c.default(
						def instanceof SQL
							? def
								// default comes pre-transformed to an ISO string for D1 storage.
								// parse back to a Date for Drizzle.
							:	z.coerce.date().parse(field.default)
					);
				}
			}
			break;
		}
	}

	if (!field.optional) c = c.notNull();
	if (field.unique) c = c.unique();
	return c;
}

function isSerializedSQL(obj: unknown): boolean {
	return typeof obj === 'object' && !!(obj as any).queryChunks;
}

function convertSerializedSQL<T = unknown>(obj: T): SQL<any> | T {
	if(isSerializedSQL(obj)) {
		return new SQL((obj as any).queryChunks)
	} else {
		return obj;
	}
}
