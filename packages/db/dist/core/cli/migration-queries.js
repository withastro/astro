import { stripVTControlCharacters } from 'node:util';
import diff from 'microdiff';
import { sql } from 'drizzle-orm';
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core';
import { customAlphabet } from 'nanoid';
import color from 'piccolore';
import { isSerializedSQL } from '../../runtime/types.js';
import { getDbError, hasPrimaryKey } from '../../runtime/utils.js';
import { MIGRATION_VERSION } from '../consts.js';
import { createClient } from '../db-client/libsql-node.js';
import { RENAME_COLUMN_ERROR, RENAME_TABLE_ERROR } from '../errors.js';
import {
	getCreateIndexQueries,
	getCreateTableQuery,
	getDropTableIfExistsQuery,
	getModifiers,
	getReferencesConfig,
	hasDefault,
	schemaTypeToSqlType,
} from '../queries.js';
import { columnSchema } from '../schemas.js';
const sqlite = new SQLiteAsyncDialect();
const genTempTableName = customAlphabet('abcdefghijklmnopqrstuvwxyz', 10);
async function getMigrationQueries({ oldSnapshot, newSnapshot, reset = false }) {
	const queries = [];
	const confirmations = [];
	if (reset) {
		const currentSnapshot = oldSnapshot;
		oldSnapshot = createEmptySnapshot();
		queries.push(...getDropTableQueriesForSnapshot(currentSnapshot));
	}
	const addedTables = getAddedTables(oldSnapshot, newSnapshot);
	const droppedTables = getDroppedTables(oldSnapshot, newSnapshot);
	const notDeprecatedDroppedTables = Object.fromEntries(
		Object.entries(droppedTables).filter(([, table]) => !table.deprecated),
	);
	if (!isEmpty(addedTables) && !isEmpty(notDeprecatedDroppedTables)) {
		const oldTable = Object.keys(notDeprecatedDroppedTables)[0];
		const newTable = Object.keys(addedTables)[0];
		throw new Error(RENAME_TABLE_ERROR(oldTable, newTable));
	}
	for (const [tableName, table] of Object.entries(addedTables)) {
		queries.push(getCreateTableQuery(tableName, table));
		queries.push(...getCreateIndexQueries(tableName, table));
	}
	for (const [tableName] of Object.entries(droppedTables)) {
		const dropQuery = `DROP TABLE ${sqlite.escapeName(tableName)}`;
		queries.push(dropQuery);
	}
	for (const [tableName, newTable] of Object.entries(newSnapshot.schema)) {
		const oldTable = oldSnapshot.schema[tableName];
		if (!oldTable) continue;
		const addedColumns = getAdded(oldTable.columns, newTable.columns);
		const droppedColumns = getDropped(oldTable.columns, newTable.columns);
		const notDeprecatedDroppedColumns = Object.fromEntries(
			Object.entries(droppedColumns).filter(([, col]) => !col.schema.deprecated),
		);
		if (!isEmpty(addedColumns) && !isEmpty(notDeprecatedDroppedColumns)) {
			throw new Error(
				RENAME_COLUMN_ERROR(
					`${tableName}.${Object.keys(addedColumns)[0]}`,
					`${tableName}.${Object.keys(notDeprecatedDroppedColumns)[0]}`,
				),
			);
		}
		const result = await getTableChangeQueries({
			tableName,
			oldTable,
			newTable,
		});
		queries.push(...result.queries);
		confirmations.push(...result.confirmations);
	}
	return { queries, confirmations };
}
async function getTableChangeQueries({ tableName, oldTable, newTable }) {
	const queries = [];
	const confirmations = [];
	const updated = getUpdatedColumns(oldTable.columns, newTable.columns);
	const added = getAdded(oldTable.columns, newTable.columns);
	const dropped = getDropped(oldTable.columns, newTable.columns);
	const hasForeignKeyChanges =
		diff(oldTable.foreignKeys ?? [], newTable.foreignKeys ?? []).length > 0;
	if (!hasForeignKeyChanges && isEmpty(updated) && isEmpty(added) && isEmpty(dropped)) {
		return {
			queries: getChangeIndexQueries({
				tableName,
				oldIndexes: oldTable.indexes,
				newIndexes: newTable.indexes,
			}),
			confirmations,
		};
	}
	if (
		!hasForeignKeyChanges &&
		isEmpty(updated) &&
		Object.values(dropped).every(canAlterTableDropColumn) &&
		Object.values(added).every(canAlterTableAddColumn)
	) {
		queries.push(
			...getAlterTableQueries(tableName, added, dropped),
			...getChangeIndexQueries({
				tableName,
				oldIndexes: oldTable.indexes,
				newIndexes: newTable.indexes,
			}),
		);
		return { queries, confirmations };
	}
	const dataLossCheck = canRecreateTableWithoutDataLoss(added, updated);
	if (dataLossCheck.dataLoss) {
		const { reason, columnName } = dataLossCheck;
		const reasonMsgs = {
			'added-required': `You added new required column '${color.bold(
				tableName + '.' + columnName,
			)}' with no default value.
      This cannot be executed on an existing table.`,
			'updated-type': `Updating existing column ${color.bold(
				tableName + '.' + columnName,
			)} to a new type that cannot be handled automatically.`,
		};
		confirmations.push(reasonMsgs[reason]);
	}
	const primaryKeyExists = Object.entries(newTable.columns).find(([, column]) =>
		hasPrimaryKey(column),
	);
	const droppedPrimaryKey = Object.entries(dropped).find(([, column]) => hasPrimaryKey(column));
	const recreateTableQueries = getRecreateTableQueries({
		tableName,
		newTable,
		added,
		hasDataLoss: dataLossCheck.dataLoss,
		migrateHiddenPrimaryKey: !primaryKeyExists && !droppedPrimaryKey,
	});
	queries.push(...recreateTableQueries, ...getCreateIndexQueries(tableName, newTable));
	return { queries, confirmations };
}
function getChangeIndexQueries({ tableName, oldIndexes = {}, newIndexes = {} }) {
	const added = getAdded(oldIndexes, newIndexes);
	const dropped = getDropped(oldIndexes, newIndexes);
	const updated = getUpdated(oldIndexes, newIndexes);
	Object.assign(dropped, updated);
	Object.assign(added, updated);
	const queries = [];
	for (const indexName of Object.keys(dropped)) {
		const dropQuery = `DROP INDEX ${sqlite.escapeName(indexName)}`;
		queries.push(dropQuery);
	}
	queries.push(...getCreateIndexQueries(tableName, { indexes: added }));
	return queries;
}
function getAddedTables(oldTables, newTables) {
	const added = {};
	for (const [key, newTable] of Object.entries(newTables.schema)) {
		if (!(key in oldTables.schema)) added[key] = newTable;
	}
	return added;
}
function getDroppedTables(oldTables, newTables) {
	const dropped = {};
	for (const [key, oldTable] of Object.entries(oldTables.schema)) {
		if (!(key in newTables.schema)) dropped[key] = oldTable;
	}
	return dropped;
}
function getAlterTableQueries(unescTableName, added, dropped) {
	const queries = [];
	const tableName = sqlite.escapeName(unescTableName);
	for (const [unescColumnName, column] of Object.entries(added)) {
		const columnName = sqlite.escapeName(unescColumnName);
		const type = schemaTypeToSqlType(column.type);
		const q = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${type}${getModifiers(
			columnName,
			column,
		)}`;
		queries.push(q);
	}
	for (const unescColumnName of Object.keys(dropped)) {
		const columnName = sqlite.escapeName(unescColumnName);
		const q = `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`;
		queries.push(q);
	}
	return queries;
}
function getRecreateTableQueries({
	tableName: unescTableName,
	newTable,
	added,
	hasDataLoss,
	migrateHiddenPrimaryKey,
}) {
	const unescTempName = `${unescTableName}_${genTempTableName()}`;
	const tempName = sqlite.escapeName(unescTempName);
	const tableName = sqlite.escapeName(unescTableName);
	if (hasDataLoss) {
		return [`DROP TABLE ${tableName}`, getCreateTableQuery(unescTableName, newTable)];
	}
	const newColumns = [...Object.keys(newTable.columns)];
	if (migrateHiddenPrimaryKey) {
		newColumns.unshift('_id');
	}
	const escapedColumns = newColumns
		.filter((i) => !(i in added))
		.map((c) => sqlite.escapeName(c))
		.join(', ');
	return [
		getCreateTableQuery(unescTempName, newTable),
		`INSERT INTO ${tempName} (${escapedColumns}) SELECT ${escapedColumns} FROM ${tableName}`,
		`DROP TABLE ${tableName}`,
		`ALTER TABLE ${tempName} RENAME TO ${tableName}`,
	];
}
function isEmpty(obj) {
	return Object.keys(obj).length === 0;
}
function canAlterTableAddColumn(column) {
	if (column.schema.unique) return false;
	if (hasRuntimeDefault(column)) return false;
	if (!column.schema.optional && !hasDefault(column)) return false;
	if (hasPrimaryKey(column)) return false;
	if (getReferencesConfig(column)) return false;
	return true;
}
function canAlterTableDropColumn(column) {
	if (column.schema.unique) return false;
	if (hasPrimaryKey(column)) return false;
	return true;
}
function canRecreateTableWithoutDataLoss(added, updated) {
	for (const [columnName, a] of Object.entries(added)) {
		if (hasPrimaryKey(a) && a.type !== 'number' && !hasDefault(a)) {
			return { dataLoss: true, columnName, reason: 'added-required' };
		}
		if (!a.schema.optional && !hasDefault(a)) {
			return { dataLoss: true, columnName, reason: 'added-required' };
		}
	}
	for (const [columnName, u] of Object.entries(updated)) {
		if (u.old.type !== u.new.type && !canChangeTypeWithoutQuery(u.old, u.new)) {
			return { dataLoss: true, columnName, reason: 'updated-type' };
		}
	}
	return { dataLoss: false };
}
function getAdded(oldObj, newObj) {
	const added = {};
	for (const [key, value] of Object.entries(newObj)) {
		if (!(key in oldObj)) added[key] = value;
	}
	return added;
}
function getDropped(oldObj, newObj) {
	const dropped = {};
	for (const [key, value] of Object.entries(oldObj)) {
		if (!(key in newObj)) dropped[key] = value;
	}
	return dropped;
}
function getUpdated(oldObj, newObj) {
	const updated = {};
	for (const [key, value] of Object.entries(newObj)) {
		const oldValue = oldObj[key];
		if (!oldValue) continue;
		if (diff(oldValue, value).length > 0) updated[key] = value;
	}
	return updated;
}
function getUpdatedColumns(oldColumns, newColumns) {
	const updated = {};
	for (const [key, newColumn] of Object.entries(newColumns)) {
		let oldColumn = oldColumns[key];
		if (!oldColumn) continue;
		if (oldColumn.type !== newColumn.type && canChangeTypeWithoutQuery(oldColumn, newColumn)) {
			const asNewColumn = columnSchema.safeParse({
				type: newColumn.type,
				schema: oldColumn.schema,
			});
			if (asNewColumn.success) {
				oldColumn = asNewColumn.data;
			}
		}
		const diffResult = diff(oldColumn, newColumn);
		if (diffResult.length > 0) {
			updated[key] = { old: oldColumn, new: newColumn };
		}
	}
	return updated;
}
const typeChangesWithoutQuery = [
	{ from: 'boolean', to: 'number' },
	{ from: 'date', to: 'text' },
	{ from: 'json', to: 'text' },
];
function canChangeTypeWithoutQuery(oldColumn, newColumn) {
	return typeChangesWithoutQuery.some(
		({ from, to }) => oldColumn.type === from && newColumn.type === to,
	);
}
function hasRuntimeDefault(column) {
	return !!(column.schema.default && isSerializedSQL(column.schema.default));
}
function getProductionCurrentSnapshot({ url, token }) {
	return getDbCurrentSnapshot(token, url);
}
async function getDbCurrentSnapshot(appToken, remoteUrl) {
	const client = createClient({
		token: appToken,
		url: remoteUrl,
	});
	try {
		const res = await client.get(
			// Latest snapshot
			sql`select snapshot from _astro_db_snapshot order by id desc limit 1;`,
		);
		return JSON.parse(res.snapshot);
	} catch (error) {
		const dbError = getDbError(error);
		if (
			dbError && // If the schema was never pushed to the database yet the table won't exist.
			// Treat a missing snapshot table as an empty table.
			// When connecting to a remote database in that condition
			// the query will fail with the following error code and message.
			((dbError.code === 'SQLITE_UNKNOWN' &&
				dbError.message === 'SQLITE_UNKNOWN: SQLite error: no such table: _astro_db_snapshot') || // When connecting to a local or in-memory database that does not have a snapshot table yet
				// the query will fail with the following error code and message.
				(dbError.code === 'SQLITE_ERROR' &&
					dbError.message === 'SQLITE_ERROR: no such table: _astro_db_snapshot'))
		) {
			return;
		}
		throw error;
	}
}
function getDropTableQueriesForSnapshot(snapshot) {
	const queries = [];
	for (const tableName of Object.keys(snapshot.schema)) {
		const dropQuery = getDropTableIfExistsQuery(tableName);
		queries.unshift(dropQuery);
	}
	return queries;
}
function createCurrentSnapshot({ tables = {} }) {
	const schema = JSON.parse(JSON.stringify(tables));
	return { version: MIGRATION_VERSION, schema };
}
function createEmptySnapshot() {
	return { version: MIGRATION_VERSION, schema: {} };
}
function formatDataLossMessage(confirmations, isColor = true) {
	const messages = [];
	messages.push(
		color.red('\u2716 We found some schema changes that cannot be handled automatically:'),
	);
	messages.push(``);
	messages.push(...confirmations.map((m, i) => color.red(`  (${i + 1}) `) + m));
	messages.push(``);
	messages.push(`To resolve, revert these changes or update your schema, and re-run the command.`);
	messages.push(
		`You may also run 'astro db push --force-reset' to ignore all warnings and force-push your local database schema to production instead. All data will be lost and the database will be reset.`,
	);
	let finalMessage = messages.join('\n');
	if (!isColor) {
		finalMessage = stripVTControlCharacters(finalMessage);
	}
	return finalMessage;
}
export {
	createCurrentSnapshot,
	createEmptySnapshot,
	formatDataLossMessage,
	getMigrationQueries,
	getProductionCurrentSnapshot,
	getTableChangeQueries,
};
