import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';
import {
	type BooleanColumn,
	type DBTable,
	type DBTables,
	type DBColumn,
	type DateColumn,
	type ColumnType,
	type JsonColumn,
	type NumberColumn,
	type TextColumn,
} from '../core/types.js';
import { bold } from 'kleur/colors';
import { type SQL, sql, getTableName } from 'drizzle-orm';
import { SQLiteAsyncDialect, type SQLiteInsert } from 'drizzle-orm/sqlite-core';
import type { AstroIntegrationLogger } from 'astro';
import type {
	ColumnsConfig,
	DBUserConfig,
	MaybeArray,
	ResolvedCollectionConfig,
} from '../core/types.js';
import { hasPrimaryKey } from '../runtime/index.js';
import { isSerializedSQL } from '../runtime/types.js';
import { SEED_EMPTY_ARRAY_ERROR, SEED_ERROR, SEED_WRITABLE_IN_PROD_ERROR } from './errors.js';

const sqlite = new SQLiteAsyncDialect();

export async function recreateTables({
	db,
	tables,
}: {
	db: SqliteRemoteDatabase;
	tables: DBTables;
}) {
	const setupQueries: SQL[] = [];
	for (const [name, collection] of Object.entries(tables)) {
		const dropQuery = sql.raw(`DROP TABLE IF EXISTS ${sqlite.escapeName(name)}`);
		const createQuery = sql.raw(getCreateTableQuery(name, collection));
		const indexQueries = getCreateIndexQueries(name, collection);
		setupQueries.push(dropQuery, createQuery, ...indexQueries.map((s) => sql.raw(s)));
	}
	for (const q of setupQueries) {
		await db.run(q);
	}
}

export async function seedData({
	db,
	data,
	logger,
	mode,
}: {
	db: SqliteRemoteDatabase;
	data: DBUserConfig['data'];
	logger?: AstroIntegrationLogger;
	mode: 'dev' | 'build';
}) {
	const dataFns = Array.isArray(data) ? data : [data];
	try {
		for (const dataFn of dataFns) {
			await dataFn({
				seed: async (config, values) => {
					seedErrorChecks(mode, config, values);
					try {
						await db.insert(config.table).values(values as any);
					} catch (e) {
						const msg = e instanceof Error ? e.message : String(e);
						throw new Error(SEED_ERROR(getTableName(config.table), msg));
					}
				},
				seedReturning: async (config, values) => {
					seedErrorChecks(mode, config, values);
					try {
						let result: SQLiteInsert<any, any, any, any> = db
							.insert(config.table)
							.values(values as any)
							.returning();
						if (!Array.isArray(values)) {
							result = result.get();
						}
						return result;
					} catch (e) {
						const msg = e instanceof Error ? e.message : String(e);
						throw new Error(SEED_ERROR(getTableName(config.table), msg));
					}
				},
				db,
				mode,
			});
		}
	} catch (e) {
		if (!(e instanceof Error)) throw e;
		(logger ?? console).error(e.message);
	}
}

function seedErrorChecks<T extends ColumnsConfig>(
	mode: 'dev' | 'build',
	{ table, writable }: ResolvedCollectionConfig<T, boolean>,
	values: MaybeArray<unknown>
) {
	const tableName = getTableName(table);
	if (writable && mode === 'build' && process.env.ASTRO_DB_TEST_ENV !== '1') {
		throw new Error(SEED_WRITABLE_IN_PROD_ERROR(tableName));
	}
	if (Array.isArray(values) && values.length === 0) {
		throw new Error(SEED_EMPTY_ARRAY_ERROR(tableName));
	}
}

export function getCreateTableQuery(collectionName: string, collection: DBTable) {
	let query = `CREATE TABLE ${sqlite.escapeName(collectionName)} (`;

	const colQueries = [];
	const colHasPrimaryKey = Object.entries(collection.columns).find(([, column]) =>
		hasPrimaryKey(column)
	);
	if (!colHasPrimaryKey) {
		colQueries.push('_id INTEGER PRIMARY KEY');
	}
	for (const [columnName, column] of Object.entries(collection.columns)) {
		const colQuery = `${sqlite.escapeName(columnName)} ${schemaTypeToSqlType(
			column.type
		)}${getModifiers(columnName, column)}`;
		colQueries.push(colQuery);
	}

	colQueries.push(...getCreateForeignKeyQueries(collectionName, collection));

	query += colQueries.join(', ') + ')';
	return query;
}

export function getCreateIndexQueries(
	collectionName: string,
	collection: Pick<DBTable, 'indexes'>
) {
	let queries: string[] = [];
	for (const [indexName, indexProps] of Object.entries(collection.indexes ?? {})) {
		const onColNames = asArray(indexProps.on);
		const onCols = onColNames.map((colName) => sqlite.escapeName(colName));

		const unique = indexProps.unique ? 'UNIQUE ' : '';
		const indexQuery = `CREATE ${unique}INDEX ${sqlite.escapeName(
			indexName
		)} ON ${sqlite.escapeName(collectionName)} (${onCols.join(', ')})`;
		queries.push(indexQuery);
	}
	return queries;
}

export function getCreateForeignKeyQueries(collectionName: string, collection: DBTable) {
	let queries: string[] = [];
	for (const foreignKey of collection.foreignKeys ?? []) {
		const columns = asArray(foreignKey.columns);
		const references = asArray(foreignKey.references);

		if (columns.length !== references.length) {
			throw new Error(
				`Foreign key on ${collectionName} is misconfigured. \`columns\` and \`references\` must be the same length.`
			);
		}
		const referencedCollection = references[0]?.schema.collection;
		if (!referencedCollection) {
			throw new Error(
				`Foreign key on ${collectionName} is misconfigured. \`references\` cannot be empty.`
			);
		}
		const query = `FOREIGN KEY (${columns
			.map((f) => sqlite.escapeName(f))
			.join(', ')}) REFERENCES ${sqlite.escapeName(referencedCollection)}(${references
			.map((r) => sqlite.escapeName(r.schema.name!))
			.join(', ')})`;
		queries.push(query);
	}
	return queries;
}

function asArray<T>(value: T | T[]) {
	return Array.isArray(value) ? value : [value];
}

export function schemaTypeToSqlType(type: ColumnType): 'text' | 'integer' {
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

export function getModifiers(columnName: string, column: DBColumn) {
	let modifiers = '';
	if (hasPrimaryKey(column)) {
		return ' PRIMARY KEY';
	}
	if (!column.schema.optional) {
		modifiers += ' NOT NULL';
	}
	if (column.schema.unique) {
		modifiers += ' UNIQUE';
	}
	if (hasDefault(column)) {
		modifiers += ` DEFAULT ${getDefaultValueSql(columnName, column)}`;
	}
	const references = getReferencesConfig(column);
	if (references) {
		const { collection, name } = references.schema;
		if (!collection || !name) {
			throw new Error(
				`Column ${collection}.${name} references a collection that does not exist. Did you apply the referenced collection to the \`tables\` object in your Astro config?`
			);
		}

		modifiers += ` REFERENCES ${sqlite.escapeName(collection)} (${sqlite.escapeName(name)})`;
	}
	return modifiers;
}

export function getReferencesConfig(column: DBColumn) {
	const canHaveReferences = column.type === 'number' || column.type === 'text';
	if (!canHaveReferences) return undefined;
	return column.schema.references;
}

// Using `DBColumn` will not narrow `default` based on the column `type`
// Handle each column separately
type WithDefaultDefined<T extends DBColumn> = T & {
	schema: Required<Pick<T['schema'], 'default'>>;
};
type DBColumnWithDefault =
	| WithDefaultDefined<TextColumn>
	| WithDefaultDefined<DateColumn>
	| WithDefaultDefined<NumberColumn>
	| WithDefaultDefined<BooleanColumn>
	| WithDefaultDefined<JsonColumn>;

// Type narrowing the default fails on union types, so use a type guard
export function hasDefault(column: DBColumn): column is DBColumnWithDefault {
	if (column.schema.default !== undefined) {
		return true;
	}
	if (hasPrimaryKey(column) && column.type === 'number') {
		return true;
	}
	return false;
}

function toDefault<T>(def: T | SQL<any>): string {
	const type = typeof def;
	if (type === 'string') {
		return sqlite.escapeString(def as string);
	} else if (type === 'boolean') {
		return def ? 'TRUE' : 'FALSE';
	} else {
		return def + '';
	}
}

function getDefaultValueSql(columnName: string, column: DBColumnWithDefault): string {
	if (isSerializedSQL(column.schema.default)) {
		return column.schema.default.sql;
	}

	switch (column.type) {
		case 'boolean':
		case 'number':
		case 'text':
		case 'date':
			return toDefault(column.schema.default);
		case 'json': {
			let stringified = '';
			try {
				stringified = JSON.stringify(column.schema.default);
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
