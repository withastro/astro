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
import { SQL, sql } from 'drizzle-orm';
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core';
import type { AstroIntegrationLogger } from 'astro';
import type { DBUserConfig } from '../core/types.js';
import { hasPrimaryKey } from '../runtime/index.js';
import type { SQLiteInsert } from 'drizzle-orm/sqlite-core';

const sqlite = new SQLiteAsyncDialect();

export async function setupDbTables({
	db,
	data,
	collections,
	logger,
	mode,
	// TODO: Remove once Turso has foreign key PRAGMA support
	useForeignKeys = false,
}: {
	db: SqliteRemoteDatabase;
	data?: DBUserConfig['data'];
	collections: DBCollections;
	logger?: AstroIntegrationLogger;
	mode: 'dev' | 'build';
	useForeignKeys?: boolean;
}) {
	const setupQueries: SQL[] = [];
	for (const [name, collection] of Object.entries(collections)) {
		// We don't reset writable collections in production
		if (mode === 'build' && collection.writable) {
			continue;
		}
		const dropQuery = sql.raw(`DROP TABLE IF EXISTS ${name}`);
		const createQuery = sql.raw(getCreateTableQuery(name, collection, useForeignKeys));
		const indexQueries = getCreateIndexQueries(name, collection);
		setupQueries.push(dropQuery, createQuery, ...indexQueries.map((s) => sql.raw(s)));
	}
	for (const q of setupQueries) {
		await db.run(q);
	}
	if (data) {
		try {
			await data({
				seed: async (collection, values, options = {}) => {
					const shouldRunInDev = (options.when === 'dev' || options.when === 'always')  ? true : true;
					const shouldRunInBuild = (options.when === 'build' || options.when === 'always')  ? true : !collection.writable;
					const shouldRun = mode === 'dev' ? shouldRunInDev : shouldRunInBuild;
					if (options.returning && (!shouldRunInDev || !shouldRunInBuild)) {
						throw new Error(`'returning' is set to true, but this data will not always seed. Set 'when' to 'always' to seed this data on every run, including production.`);
					}
					if (!shouldRun) {
						return;
					}
					let result: SQLiteInsert<any, any, any, any> = db
						.insert(collection.table)
						.values(values as any);
					if (options.returning) {
						result = result.returning();
					}
					if (!Array.isArray(values)) {
						result = result.get();
					}
					return await result.execute();
				},
				db,
				mode,
			});
		} catch (error) {
			(logger ?? console).error(
				`Failed to seed data. Did you update to match recent schema changes?`
			);
			(logger ?? console).error(error as string);
		}
	}
}

export function getCreateTableQuery(
	collectionName: string,
	collection: DBCollection,
	// TODO: Remove once Turso has foreign key PRAGMA support
	useForeignKeys = false
) {
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

	if (useForeignKeys) {
		colQueries.push(...getCreateForeignKeyQueries(collectionName, collection));
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

export function getCreateForeignKeyQueries(collectionName: string, collection: DBCollection) {
	let queries: string[] = [];
	for (const foreignKey of collection.foreignKeys ?? []) {
		const fields = asArray(foreignKey.fields);
		const references = asArray(foreignKey.references());

		if (fields.length !== references.length) {
			throw new Error(
				`Foreign key on ${collectionName} is misconfigured. \`fields\` and \`references\` must be the same length.`
			);
		}
		const referencedCollection = references[0]?.collection;
		if (!referencedCollection) {
			throw new Error(
				`Foreign key on ${collectionName} is misconfigured. \`references\` cannot be empty.`
			);
		}
		const query = `FOREIGN KEY (${fields
			.map((f) => sqlite.escapeName(f))
			.join(', ')}) REFERENCES ${sqlite.escapeName(referencedCollection)}(${references
			.map((r) => sqlite.escapeName(r.name!))
			.join(', ')})`;
		queries.push(query);
	}
	return queries;
}

function asArray<T>(value: T | T[]) {
	return Array.isArray(value) ? value : [value];
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
	const references = getReferencesConfig(field);
	if (references) {
		const { collection, name } = references;
		if (!collection || !name) {
			throw new Error(
				`Invalid reference for field ${fieldName}. This is an unexpected error that should be reported to the Astro team.`
			);
		}

		modifiers += ` REFERENCES ${sqlite.escapeName(collection)} (${sqlite.escapeName(name)})`;
	}
	return modifiers;
}

function getReferencesConfig(field: DBField) {
	const canHaveReferences = field.type === 'number' || field.type === 'text';
	if (!canHaveReferences) return undefined;
	return field.references?.();
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

function toStringDefault<T>(def: T | SQL<any>): string {
	const type = typeof def;
	if (def instanceof SQL) {
		return sqlite.sqlToQuery(def).sql;
	} else if (type === 'string') {
		return sqlite.escapeString(def as string);
	} else if (type === 'boolean') {
		return def ? 'TRUE' : 'FALSE';
	} else {
		return def + '';
	}
}

function getDefaultValueSql(columnName: string, column: DBFieldWithDefault): string {
	switch (column.type) {
		case 'boolean':
		case 'number':
		case 'text':
		case 'date':
			return toStringDefault(column.default);
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
