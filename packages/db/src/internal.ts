import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';
import { createClient } from '@libsql/client';
import {
	type ReadableDBCollection,
	type BooleanField,
	type DBCollection,
	type DBCollections,
	type DBField,
	type DateField,
	type FieldType,
	type JsonField,
	type NumberField,
	type TextField,
} from './types.js';
import { type LibSQLDatabase, drizzle } from 'drizzle-orm/libsql';
import { SQLiteAsyncDialect, SQLiteTable } from 'drizzle-orm/sqlite-core';
import { bold } from 'kleur/colors';
import { type SQL, type ColumnBuilderBaseConfig, type ColumnDataType, sql } from 'drizzle-orm';
import {
	customType,
	integer,
	sqliteTable,
	text,
	type SQLiteColumnBuilderBase,
} from 'drizzle-orm/sqlite-core';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import type { AstroIntegrationLogger } from 'astro';

export type SqliteDB = SqliteRemoteDatabase;
export type {
	AstroTable,
	AstroText,
	AstroDate,
	AstroBoolean,
	AstroNumber,
	AstroJson,
	AstroId,
} from './types.js';

const sqlite = new SQLiteAsyncDialect();

function isReadableCollection(collection: DBCollection): collection is ReadableDBCollection {
	return !collection.writable;
}

function checkIfModificationIsAllowed(collections: DBCollections, Table: SQLiteTable) {
	// This totally works, don't worry about it
	const tableName = (Table as any)[(SQLiteTable as any).Symbol.Name];
	const collection = collections[tableName];
	if (collection.writable) {
		throw new Error(`The [${tableName}] collection is read-only.`);
	}
}

export { createDb as createStudioDb } from './cli/sync/remote-db.js';

export async function createDb({
	collections,
	dbUrl,
	seeding,
}: {
	dbUrl: string;
	collections: DBCollections;
	seeding: boolean;
}) {
	const client = createClient({ url: dbUrl });
	const db = drizzle(client);

	if (seeding) return db;

	const { insert: drizzleInsert, update: drizzleUpdate, delete: drizzleDelete } = db;
	return Object.assign(db, {
		insert(Table: SQLiteTable) {
			//console.log('Table info...', Table._);
			checkIfModificationIsAllowed(collections, Table);
			return drizzleInsert.call(this, Table);
		},
		update(Table: SQLiteTable) {
			checkIfModificationIsAllowed(collections, Table);
			return drizzleUpdate.call(this, Table);
		},
		delete(Table: SQLiteTable) {
			checkIfModificationIsAllowed(collections, Table);
			return drizzleDelete.call(this, Table);
		},
	});
}

export async function setupDbTables({
	db,
	collections,
	logger,
}: {
	db: LibSQLDatabase;
	collections: DBCollections;
	logger: AstroIntegrationLogger;
}) {
	const setupQueries: SQL[] = [];
	for (const [name, collection] of Object.entries(collections)) {
		const dropQuery = sql.raw(`DROP TABLE IF EXISTS ${name}`);
		const createQuery = sql.raw(getCreateTableQuery(name, collection));
		setupQueries.push(dropQuery, createQuery);
	}
	for (const q of setupQueries) {
		await db.run(q);
	}
	for (const [name, collection] of Object.entries(collections)) {
		if (!isReadableCollection(collection) || !collection.data) continue;

		const table = collectionToTable(name, collection);
		try {
			await db.insert(table).values(await collection.data());
		} catch (e) {
			logger.error(
				`Failed to seed ${bold(
					name
				)} data. Did you update to match recent schema changes? Full error:\n\n${e}`
			);
		}
	}
}

export function getCreateTableQuery(collectionName: string, collection: DBCollection) {
	let query = `CREATE TABLE ${sqlite.escapeName(collectionName)} (`;

	const colQueries = ['"id" text PRIMARY KEY'];
	for (const [columnName, column] of Object.entries(collection.fields)) {
		const colQuery = `${sqlite.escapeName(columnName)} ${schemaTypeToSqlType(
			column.type
		)}${getModifiers(columnName, column)}`;
		colQueries.push(colQuery);
	}

	query += colQueries.join(', ') + ')';
	return query;
}

function schemaTypeToSqlType(type: FieldType): 'text' | 'integer' {
	switch (type) {
		case 'date':
		case 'text':
		case 'json':
			return 'text';
		case 'number':
		case 'boolean':
			return 'integer';
	}
}

function getModifiers(columnName: string, column: DBField) {
	let modifiers = '';
	if (!column.optional) {
		modifiers += ' NOT NULL';
	}
	if (column.unique) {
		modifiers += ' UNIQUE';
	}
	if (hasDefault(column)) {
		modifiers += ` DEFAULT ${getDefaultValueSql(columnName, column)}`;
	}
	return modifiers;
}

// Using `DBField` will not narrow `default` based on the column `type`
// Handle each field separately
type WithDefaultDefined<T extends DBField> = T & Required<Pick<T, 'default'>>;
type DBFieldWithDefault =
	| WithDefaultDefined<TextField>
	| WithDefaultDefined<DateField>
	| WithDefaultDefined<NumberField>
	| WithDefaultDefined<BooleanField>
	| WithDefaultDefined<JsonField>;

// Type narrowing the default fails on union types, so use a type guard
function hasDefault(field: DBField): field is DBFieldWithDefault {
	return field.default !== undefined;
}

function getDefaultValueSql(columnName: string, column: DBFieldWithDefault): string {
	switch (column.type) {
		case 'boolean':
			return column.default ? 'TRUE' : 'FALSE';
		case 'number':
			return `${column.default}`;
		case 'text':
			return sqlite.escapeString(column.default);
		case 'date':
			return column.default === 'now' ? 'CURRENT_TIMESTAMP' : sqlite.escapeString(column.default);
		case 'json': {
			let stringified = '';
			try {
				stringified = JSON.stringify(column.default);
			} catch (e) {
				// eslint-disable-next-line no-console
				console.info(
					`Invalid default value for column ${bold(
						columnName
					)}. Defaults must be valid JSON when using the \`json()\` type.`
				);
				process.exit(0);
			}

			return sqlite.escapeString(stringified);
		}
	}
}

function generateId() {
	return nanoid(12);
}

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

const initialColumns = {
	id: text('id')
		.primaryKey()
		.$default(() => generateId()),
};

type D1ColumnBuilder = SQLiteColumnBuilderBase<
	ColumnBuilderBaseConfig<ColumnDataType, string> & { data: unknown }
>;

export function collectionToTable(
	name: string,
	collection: DBCollection,
	isJsonSerializable = true
) {
	const columns: Record<string, D1ColumnBuilder> & typeof initialColumns = {
		// Spread to avoid mutating `initialColumns`
		...initialColumns,
	};

	for (const [fieldName, field] of Object.entries(collection.fields)) {
		columns[fieldName] = columnMapper(fieldName, field, isJsonSerializable);
	}

	const table = sqliteTable(name, columns);

	return table;
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
			break;
		}
		case 'number': {
			c = integer(fieldName);
			if (field.default !== undefined) c = c.default(field.default);
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
					c = c.default(field.default === 'now' ? sql`CURRENT_TIMESTAMP` : field.default);
				}
			} else {
				c = dateType(fieldName);
				if (field.default !== undefined) {
					c = c.default(
						field.default === 'now'
							? sql`CURRENT_TIMESTAMP`
							: // default comes pre-transformed to an ISO string for D1 storage.
								// parse back to a Date for Drizzle.
								z.coerce.date().parse(field.default)
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
