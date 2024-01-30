import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';
import {
	type BooleanField,
	type DBCollection,
	type DBCollections,
	type DBField,
	type DateField,
	type FieldType,
	type JsonField,
	type NumberField,
	type TextField,
} from '../core/types.js';
import { bold } from 'kleur/colors';
import { type SQL, sql } from 'drizzle-orm';
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core';
import type { AstroIntegrationLogger } from 'astro';
import type { DBUserConfig } from '../core/types.js';
import { collectionToTable, hasPrimaryKey } from '../runtime/index.js';

const sqlite = new SQLiteAsyncDialect();

export async function setupDbTables({
	db,
	data,
	collections,
	logger,
	mode,
}: {
	db: SqliteRemoteDatabase;
	data?: DBUserConfig['data'];
	collections: DBCollections;
	logger?: AstroIntegrationLogger;
	mode: 'dev' | 'build';
}) {
	const setupQueries: SQL[] = [];
	for (const [name, collection] of Object.entries(collections)) {
		const dropQuery = sql.raw(`DROP TABLE IF EXISTS ${name}`);
		const createQuery = sql.raw(getCreateTableQuery(name, collection));
		const indexQueries = getCreateIndexQueries(name, collection);
		setupQueries.push(dropQuery, createQuery, ...indexQueries.map((s) => sql.raw(s)));
	}
	for (const q of setupQueries) {
		await db.run(q);
	}
	if (data) {
		for (const [name, collection] of Object.entries(collections)) {
			const table = collectionToTable(name, collection);
			collection._setMeta?.({ table });
		}
		try {
			await data({
				async seed({ table }, values) {
					const result = Array.isArray(values)
						? // TODO: fix values typing once we can infer fields type correctly
							await db
								.insert(table)
								.values(values as any)
								.returning()
						: await db
								.insert(table)
								.values(values as any)
								.returning()
								.get();
					return result;
				},
				db,
				mode,
			});
		} catch (e) {
			(logger ?? console).error(
				`Failed to seed data. Did you update to match recent schema changes? Full error:\n\n${e}`
			);
		}
	}
}

export function getCreateTableQuery(collectionName: string, collection: DBCollection) {
	let query = `CREATE TABLE ${sqlite.escapeName(collectionName)} (`;

	const colQueries = [];
	const colHasPrimaryKey = Object.entries(collection.fields).find(([, field]) =>
		hasPrimaryKey(field)
	);
	if (!colHasPrimaryKey) {
		colQueries.push('_id INTEGER PRIMARY KEY');
	}
	for (const [columnName, column] of Object.entries(collection.fields)) {
		const colQuery = `${sqlite.escapeName(columnName)} ${schemaTypeToSqlType(
			column.type
		)}${getModifiers(columnName, column)}`;
		colQueries.push(colQuery);
	}

	query += colQueries.join(', ') + ')';
	return query;
}

export function getCreateIndexQueries(
	collectionName: string,
	collection: Pick<DBCollection, 'indexes'>
) {
	let queries: string[] = [];
	for (const [indexName, indexProps] of Object.entries(collection.indexes ?? {})) {
		const onColNames = Array.isArray(indexProps.on) ? indexProps.on : [indexProps.on];
		const onCols = onColNames.map((colName) => sqlite.escapeName(colName));

		const unique = indexProps.unique ? 'UNIQUE ' : '';
		const indexQuery = `CREATE ${unique}INDEX ${sqlite.escapeName(
			indexName
		)} ON ${sqlite.escapeName(collectionName)} (${onCols.join(', ')})`;
		queries.push(indexQuery);
	}
	return queries;
}

export function schemaTypeToSqlType(type: FieldType): 'text' | 'integer' {
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

export function getModifiers(fieldName: string, field: DBField) {
	let modifiers = '';
	if (hasPrimaryKey(field)) {
		return ' PRIMARY KEY';
	}
	if (!field.optional) {
		modifiers += ' NOT NULL';
	}
	if (field.unique) {
		modifiers += ' UNIQUE';
	}
	if (hasDefault(field)) {
		modifiers += ` DEFAULT ${getDefaultValueSql(fieldName, field)}`;
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
export function hasDefault(field: DBField): field is DBFieldWithDefault {
	if (field.default !== undefined) {
		return true;
	}
	if (hasPrimaryKey(field) && field.type === 'number') {
		return true;
	}
	return false;
}

function getDefaultValueSql(columnName: string, column: DBFieldWithDefault): string {
	switch (column.type) {
		case 'boolean':
			return column.default ? 'TRUE' : 'FALSE';
		case 'number':
			return `${column.default || 'AUTOINCREMENT'}`;
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
				console.log(
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
