import type { SQL } from 'drizzle-orm';
import { SQLiteAsyncDialect } from "drizzle-orm/sqlite-core";
import type { BooleanColumn, ColumnType, DateColumn, DBColumn, DBColumns, DBTable, JsonColumn, NumberColumn, ResolvedDBTable, ResolvedIndexes, TextColumn } from "../types.js";
import type { DatabaseBackend } from "./types.js";
import { hasPrimaryKey } from "../../runtime/index.js";
import { bold } from "kleur/colors";
import { isSerializedSQL } from '../../runtime/types.js';
import { asArray } from '../utils.js';
import { FOREIGN_KEY_DNE_ERROR, FOREIGN_KEY_REFERENCES_EMPTY_ERROR, FOREIGN_KEY_REFERENCES_LENGTH_ERROR } from '../../runtime/errors.js';
import { getAdded, getDropped, getUpdated } from './utils.js';
import { customAlphabet } from 'nanoid';

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

const genTempTableName = customAlphabet('abcdefghijklmnopqrstuvwxyz', 10);

export class SqliteBackendBase implements DatabaseBackend<string> {
	private readonly dialect = new SQLiteAsyncDialect();

	getDropIfExistsOps(tableName: string): string[] {
		return [`DROP TABLE IF EXISTS ${this.dialect.escapeName(tableName)}`];
	}

	getCreateOps(tableName: string, table: DBTable): string[] {
		let query = `CREATE TABLE ${this.dialect.escapeName(tableName)} (`;

		const colQueries = [];
		const colHasPrimaryKey = Object.entries(table.columns).find(([, column]) =>
			hasPrimaryKey(column),
		);
		if (!colHasPrimaryKey) {
			colQueries.push('_id INTEGER PRIMARY KEY');
		}
		for (const [columnName, column] of Object.entries(table.columns)) {
			const colQuery = `${this.dialect.escapeName(columnName)} ${this.schemaTypeToSqlType(
				column.type,
			)}${this.getModifiers(columnName, column)}`;
			colQueries.push(colQuery);
		}

		colQueries.push(...this.getCreateForeignKeyOps(tableName, table));

		query += colQueries.join(', ') + ')';
		return [query];
	}

	getCreateIndexOps(tableName: string, table: Pick<DBTable, "indexes">): string[] {
		let queries: string[] = [];
		for (const [indexName, indexProps] of Object.entries(table.indexes ?? {})) {
			const onColNames = asArray(indexProps.on);
			const onCols = onColNames.map((colName) => this.dialect.escapeName(colName));

			const unique = indexProps.unique ? 'UNIQUE ' : '';
			const indexQuery = `CREATE ${unique}INDEX ${this.dialect.escapeName(
				indexName,
			)} ON ${this.dialect.escapeName(tableName)} (${onCols.join(', ')})`;
			queries.push(indexQuery);
		}
		return queries;
	}

	getChangeIndexOps({ tableName, oldIndexes = {}, newIndexes = {} }: {
		tableName: string;
		oldIndexes?: ResolvedIndexes;
		newIndexes?: ResolvedIndexes;
	}): string[] {
		const added = getAdded(oldIndexes, newIndexes);
		const dropped = getDropped(oldIndexes, newIndexes);
		const updated = getUpdated(oldIndexes, newIndexes);

		Object.assign(dropped, updated);
		Object.assign(added, updated);

		const queries: string[] = [];
		for (const indexName of Object.keys(dropped)) {
			const dropQuery = `DROP INDEX ${this.dialect.escapeName(indexName)}`;
			queries.push(dropQuery);
		}
		queries.push(...this.getCreateIndexOps(tableName, { indexes: added }));
		return queries;
	}

	getRecreateTableQueries({
		tableName: unescTableName,
		newTable,
		added,
		hasDataLoss,
		migrateHiddenPrimaryKey,
	}: {
		tableName: string;
		newTable: ResolvedDBTable;
		added: Record<string, DBColumn>;
		hasDataLoss: boolean;
		migrateHiddenPrimaryKey: boolean;
	}): string[] {
		const unescTempName = `${unescTableName}_${genTempTableName()}`;
		const tempName = this.dialect.escapeName(unescTempName);
		const tableName = this.dialect.escapeName(unescTableName);

		if (hasDataLoss) {
			return [`DROP TABLE ${tableName}`, ...this.getCreateOps(unescTableName, newTable)];
		}
		const newColumns = [...Object.keys(newTable.columns)];
		if (migrateHiddenPrimaryKey) {
			newColumns.unshift('_id');
		}
		const escapedColumns = newColumns
			.filter((i) => !(i in added))
			.map((c) => this.dialect.escapeName(c))
			.join(', ');

		return [
			...this.getCreateOps(unescTempName, newTable),
			`INSERT INTO ${tempName} (${escapedColumns}) SELECT ${escapedColumns} FROM ${tableName}`,
			`DROP TABLE ${tableName}`,
			`ALTER TABLE ${tempName} RENAME TO ${tableName}`,
		];
	}
	getAlterTableQueries(
		unescTableName: string,
		added: DBColumns,
		dropped: DBColumns,
	): string[] {
		const queries: string[] = [];
		const tableName = this.dialect.escapeName(unescTableName);

		for (const [unescColumnName, column] of Object.entries(added)) {
			const columnName = this.dialect.escapeName(unescColumnName);
			const type = this.schemaTypeToSqlType(column.type);
			const q = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${type}${this.getModifiers(
				columnName,
				column,
			)}`;
			queries.push(q);
		}

		for (const unescColumnName of Object.keys(dropped)) {
			const columnName = this.dialect.escapeName(unescColumnName);
			const q = `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`;
			queries.push(q);
		}

		return queries;
	}

	executeOps(ops: string[]): Promise<void> {

	}

	getClientImportStatement(): string {
		throw new Error("Method not implemented.");
	}
	getTypesModule(): string {
		throw new Error("Method not implemented.");
	}

	private getCreateForeignKeyOps(tableName: string, table: DBTable): string[] {
		let queries: string[] = [];
		for (const foreignKey of table.foreignKeys ?? []) {
			const columns = asArray(foreignKey.columns);
			const references = asArray(foreignKey.references);

			if (columns.length !== references.length) {
				throw new Error(FOREIGN_KEY_REFERENCES_LENGTH_ERROR(tableName));
			}
			const firstReference = references[0];
			if (!firstReference) {
				throw new Error(FOREIGN_KEY_REFERENCES_EMPTY_ERROR(tableName));
			}
			const referencedTable = firstReference.schema.collection;
			if (!referencedTable) {
				throw new Error(FOREIGN_KEY_DNE_ERROR(tableName));
			}
			const query = `FOREIGN KEY (${columns
				.map((f) => this.dialect.escapeName(f))
				.join(', ')}) REFERENCES ${this.dialect.escapeName(referencedTable)}(${references
					.map((r) => this.dialect.escapeName(r.schema.name!))
					.join(', ')})`;
			queries.push(query);
		}
		return queries;
	}


	private schemaTypeToSqlType(type: ColumnType): 'text' | 'integer' {
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

	private getModifiers(columnName: string, column: DBColumn) {
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
		if (this.hasDefault(column)) {
			modifiers += ` DEFAULT ${getDefaultValueSql(columnName, column)}`;
		}
		const references = getReferencesConfig(column);
		if (references) {
			const { collection: tableName, name } = references.schema;
			if (!tableName || !name) {
				throw new Error(REFERENCE_DNE_ERROR(columnName));
			}

			modifiers += ` REFERENCES ${sqlite.escapeName(tableName)} (${sqlite.escapeName(name)})`;
		}
		return modifiers;
	}

	private hasDefault(column: DBColumn): column is DBColumnWithDefault {
		if (column.schema.default !== undefined) {
			return true;
		}
		if (hasPrimaryKey(column) && column.type === 'number') {
			return true;
		}
		return false;
	}

	private toDefault<T>(def: T | SQL<any>): string {
		const type = typeof def;
		if (type === 'string') {
			return this.dialect.escapeString(def as string);
		} else if (type === 'boolean') {
			return def ? 'TRUE' : 'FALSE';
		} else {
			return def + '';
		}
	}

	private getDefaultValueSql(columnName: string, column: DBColumnWithDefault): string {
		if (isSerializedSQL(column.schema.default)) {
			return column.schema.default.sql;
		}

		switch (column.type) {
			case 'boolean':
			case 'number':
			case 'text':
			case 'date':
				return this.toDefault(column.schema.default);
			case 'json': {
				let stringified = '';
				try {
					stringified = JSON.stringify(column.schema.default);
				} catch {
					// biome-ignore lint/suspicious/noConsoleLog: allowed
					console.log(
						`Invalid default value for column ${bold(
							columnName,
						)}. Defaults must be valid JSON when using the \`json()\` type.`,
					);
					process.exit(0);
				}

				return this.dialect.escapeString(stringified);
			}
		}
	}
}
