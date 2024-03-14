import deepDiff from 'deep-diff';
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core';
import * as color from 'kleur/colors';
import { customAlphabet } from 'nanoid';
import stripAnsi from 'strip-ansi';
import { hasPrimaryKey } from '../../runtime/index.js';
import {
	getCreateIndexQueries,
	getCreateTableQuery,
	getDropTableIfExistsQuery,
	getModifiers,
	getReferencesConfig,
	hasDefault,
	schemaTypeToSqlType,
} from '../../runtime/queries.js';
import { isSerializedSQL } from '../../runtime/types.js';
import { MIGRATION_VERSION } from '../consts.js';
import { RENAME_COLUMN_ERROR, RENAME_TABLE_ERROR } from '../errors.js';
import { columnSchema } from '../schemas.js';
import {
	type BooleanColumn,
	type ColumnType,
	type DBColumn,
	type DBColumns,
	type DBConfig,
	type DBSnapshot,
	type DBTable,
	type DBTables,
	type DateColumn,
	type Indexes,
	type JsonColumn,
	type NumberColumn,
	type TextColumn,
} from '../types.js';
import { type Result, getRemoteDatabaseUrl } from '../utils.js';
import { safeFetch } from '../../runtime/utils.js';


const sqlite = new SQLiteAsyncDialect();
const genTempTableName = customAlphabet('abcdefghijklmnopqrstuvwxyz', 10);

export async function getMigrationQueries({
	oldSnapshot,
	newSnapshot,
}: {
	oldSnapshot: DBSnapshot;
	newSnapshot: DBSnapshot;
}): Promise<{ queries: string[]; confirmations: string[] }> {
	const queries: string[] = [];
	const confirmations: string[] = [];
	const addedCollections = getAddedCollections(oldSnapshot, newSnapshot);
	const droppedTables = getDroppedCollections(oldSnapshot, newSnapshot);
	const notDeprecatedDroppedTables = Object.fromEntries(
		Object.entries(droppedTables).filter(([, table]) => !table.deprecated)
	);
	if (!isEmpty(addedCollections) && !isEmpty(notDeprecatedDroppedTables)) {
		throw new Error(
			RENAME_TABLE_ERROR(
				Object.keys(addedCollections)[0],
				Object.keys(notDeprecatedDroppedTables)[0]
			)
		);
	}

	for (const [collectionName, collection] of Object.entries(addedCollections)) {
		queries.push(getCreateTableQuery(collectionName, collection));
		queries.push(...getCreateIndexQueries(collectionName, collection));
	}

	for (const [collectionName] of Object.entries(droppedTables)) {
		const dropQuery = `DROP TABLE ${sqlite.escapeName(collectionName)}`;
		queries.push(dropQuery);
	}

	for (const [collectionName, newCollection] of Object.entries(newSnapshot.schema)) {
		const oldCollection = oldSnapshot.schema[collectionName];
		if (!oldCollection) continue;
		const addedColumns = getAdded(oldCollection.columns, newCollection.columns);
		const droppedColumns = getDropped(oldCollection.columns, newCollection.columns);
		const notDeprecatedDroppedColumns = Object.fromEntries(
			Object.entries(droppedColumns).filter(([key, col]) => !col.schema.deprecated)
		);
		if (!isEmpty(addedColumns) && !isEmpty(notDeprecatedDroppedColumns)) {
			throw new Error(
				RENAME_COLUMN_ERROR(
					`${collectionName}.${Object.keys(addedColumns)[0]}`,
					`${collectionName}.${Object.keys(notDeprecatedDroppedColumns)[0]}`
				)
			);
		}
		const result = await getCollectionChangeQueries({
			collectionName,
			oldCollection,
			newCollection,
		});
		queries.push(...result.queries);
		confirmations.push(...result.confirmations);
	}
	return { queries, confirmations };
}

export async function getCollectionChangeQueries({
	collectionName,
	oldCollection,
	newCollection,
}: {
	collectionName: string;
	oldCollection: DBTable;
	newCollection: DBTable;
}): Promise<{ queries: string[]; confirmations: string[] }> {
	const queries: string[] = [];
	const confirmations: string[] = [];
	const updated = getUpdatedColumns(oldCollection.columns, newCollection.columns);
	const added = getAdded(oldCollection.columns, newCollection.columns);
	const dropped = getDropped(oldCollection.columns, newCollection.columns);
	/** Any foreign key changes require a full table recreate */
	const hasForeignKeyChanges = Boolean(
		deepDiff(oldCollection.foreignKeys, newCollection.foreignKeys)
	);

	if (!hasForeignKeyChanges && isEmpty(updated) && isEmpty(added) && isEmpty(dropped)) {
		return {
			queries: getChangeIndexQueries({
				collectionName,
				oldIndexes: oldCollection.indexes,
				newIndexes: newCollection.indexes,
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
			...getAlterTableQueries(collectionName, added, dropped),
			...getChangeIndexQueries({
				collectionName,
				oldIndexes: oldCollection.indexes,
				newIndexes: newCollection.indexes,
			})
		);
		return { queries, confirmations };
	}

	const dataLossCheck = canRecreateTableWithoutDataLoss(added, updated);
	if (dataLossCheck.dataLoss) {
		const { reason, columnName } = dataLossCheck;
		const reasonMsgs: Record<DataLossReason, string> = {
			'added-required': `You added new required column '${color.bold(
				collectionName + '.' + columnName
			)}' with no default value.\n      This cannot be executed on an existing table.`,
			'updated-type': `Updating existing column ${color.bold(
				collectionName + '.' + columnName
			)} to a new type that cannot be handled automatically.`,
		};
		confirmations.push(reasonMsgs[reason]);
	}

	const primaryKeyExists = Object.entries(newCollection.columns).find(([, column]) =>
		hasPrimaryKey(column)
	);
	const droppedPrimaryKey = Object.entries(dropped).find(([, column]) => hasPrimaryKey(column));

	const recreateTableQueries = getRecreateTableQueries({
		collectionName,
		newCollection,
		added,
		hasDataLoss: dataLossCheck.dataLoss,
		migrateHiddenPrimaryKey: !primaryKeyExists && !droppedPrimaryKey,
	});
	queries.push(...recreateTableQueries, ...getCreateIndexQueries(collectionName, newCollection));
	return { queries, confirmations };
}

function getChangeIndexQueries({
	collectionName,
	oldIndexes = {},
	newIndexes = {},
}: {
	collectionName: string;
	oldIndexes?: Indexes;
	newIndexes?: Indexes;
}) {
	const added = getAdded(oldIndexes, newIndexes);
	const dropped = getDropped(oldIndexes, newIndexes);
	const updated = getUpdated(oldIndexes, newIndexes);

	Object.assign(dropped, updated);
	Object.assign(added, updated);

	const queries: string[] = [];
	for (const indexName of Object.keys(dropped)) {
		const dropQuery = `DROP INDEX ${sqlite.escapeName(indexName)}`;
		queries.push(dropQuery);
	}
	queries.push(...getCreateIndexQueries(collectionName, { indexes: added }));
	return queries;
}

function getAddedCollections(oldCollections: DBSnapshot, newCollections: DBSnapshot): DBTables {
	const added: DBTables = {};
	for (const [key, newCollection] of Object.entries(newCollections.schema)) {
		if (!(key in oldCollections.schema)) added[key] = newCollection;
	}
	return added;
}

function getDroppedCollections(oldCollections: DBSnapshot, newCollections: DBSnapshot): DBTables {
	const dropped: DBTables = {};
	for (const [key, oldCollection] of Object.entries(oldCollections.schema)) {
		if (!(key in newCollections.schema)) dropped[key] = oldCollection;
	}
	return dropped;
}

/**
 * Get ALTER TABLE queries to update the table schema. Assumes all added and dropped columns pass
 * `canUseAlterTableAddColumn` and `canAlterTableDropColumn` checks!
 */
function getAlterTableQueries(
	unescapedCollectionName: string,
	added: DBColumns,
	dropped: DBColumns
): string[] {
	const queries: string[] = [];
	const collectionName = sqlite.escapeName(unescapedCollectionName);

	for (const [unescColumnName, column] of Object.entries(added)) {
		const columnName = sqlite.escapeName(unescColumnName);
		const type = schemaTypeToSqlType(column.type);
		const q = `ALTER TABLE ${collectionName} ADD COLUMN ${columnName} ${type}${getModifiers(
			columnName,
			column
		)}`;
		queries.push(q);
	}

	for (const unescColumnName of Object.keys(dropped)) {
		const columnName = sqlite.escapeName(unescColumnName);
		const q = `ALTER TABLE ${collectionName} DROP COLUMN ${columnName}`;
		queries.push(q);
	}

	return queries;
}

function getRecreateTableQueries({
	collectionName: unescCollectionName,
	newCollection,
	added,
	hasDataLoss,
	migrateHiddenPrimaryKey,
}: {
	collectionName: string;
	newCollection: DBTable;
	added: Record<string, DBColumn>;
	hasDataLoss: boolean;
	migrateHiddenPrimaryKey: boolean;
}): string[] {
	const unescTempName = `${unescCollectionName}_${genTempTableName()}`;
	const tempName = sqlite.escapeName(unescTempName);
	const collectionName = sqlite.escapeName(unescCollectionName);

	if (hasDataLoss) {
		return [
			`DROP TABLE ${collectionName}`,
			getCreateTableQuery(unescCollectionName, newCollection),
		];
	}
	const newColumns = [...Object.keys(newCollection.columns)];
	if (migrateHiddenPrimaryKey) {
		newColumns.unshift('_id');
	}
	const escapedColumns = newColumns
		.filter((i) => !(i in added))
		.map((c) => sqlite.escapeName(c))
		.join(', ');

	return [
		getCreateTableQuery(unescTempName, newCollection),
		`INSERT INTO ${tempName} (${escapedColumns}) SELECT ${escapedColumns} FROM ${collectionName}`,
		`DROP TABLE ${collectionName}`,
		`ALTER TABLE ${tempName} RENAME TO ${collectionName}`,
	];
}

function isEmpty(obj: Record<string, unknown>) {
	return Object.keys(obj).length === 0;
}

/**
 * ADD COLUMN is preferred for O(1) table updates, but is only supported for _some_ column
 * definitions.
 *
 * @see https://www.sqlite.org/lang_altertable.html#alter_table_add_column
 */
function canAlterTableAddColumn(column: DBColumn) {
	if (column.schema.unique) return false;
	if (hasRuntimeDefault(column)) return false;
	if (!column.schema.optional && !hasDefault(column)) return false;
	if (hasPrimaryKey(column)) return false;
	if (getReferencesConfig(column)) return false;
	return true;
}

function canAlterTableDropColumn(column: DBColumn) {
	if (column.schema.unique) return false;
	if (hasPrimaryKey(column)) return false;
	return true;
}

type DataLossReason = 'added-required' | 'updated-type';
type DataLossResponse =
	| { dataLoss: false }
	| { dataLoss: true; columnName: string; reason: DataLossReason };

function canRecreateTableWithoutDataLoss(
	added: DBColumns,
	updated: UpdatedColumns
): DataLossResponse {
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

function getAdded<T>(oldObj: Record<string, T>, newObj: Record<string, T>) {
	const added: Record<string, T> = {};
	for (const [key, value] of Object.entries(newObj)) {
		if (!(key in oldObj)) added[key] = value;
	}
	return added;
}

function getDropped<T>(oldObj: Record<string, T>, newObj: Record<string, T>) {
	const dropped: Record<string, T> = {};
	for (const [key, value] of Object.entries(oldObj)) {
		if (!(key in newObj)) dropped[key] = value;
	}
	return dropped;
}

function getUpdated<T>(oldObj: Record<string, T>, newObj: Record<string, T>) {
	const updated: Record<string, T> = {};
	for (const [key, value] of Object.entries(newObj)) {
		const oldValue = oldObj[key];
		if (!oldValue) continue;
		if (deepDiff(oldValue, value)) updated[key] = value;
	}
	return updated;
}

type UpdatedColumns = Record<string, { old: DBColumn; new: DBColumn }>;

function getUpdatedColumns(oldColumns: DBColumns, newColumns: DBColumns): UpdatedColumns {
	const updated: UpdatedColumns = {};
	for (const [key, newColumn] of Object.entries(newColumns)) {
		let oldColumn = oldColumns[key];
		if (!oldColumn) continue;

		if (oldColumn.type !== newColumn.type && canChangeTypeWithoutQuery(oldColumn, newColumn)) {
			// If we can safely change the type without a query,
			// try parsing the old schema as the new schema.
			// This lets us diff the columns as if they were the same type.
			const asNewColumn = columnSchema.safeParse({
				type: newColumn.type,
				schema: oldColumn.schema,
			});
			if (asNewColumn.success) {
				oldColumn = asNewColumn.data;
			}
			// If parsing fails, move on to the standard diff.
		}

		const diff = deepDiff(oldColumn, newColumn);

		if (diff) {
			updated[key] = { old: oldColumn, new: newColumn };
		}
	}
	return updated;
}
const typeChangesWithoutQuery: Array<{ from: ColumnType; to: ColumnType }> = [
	{ from: 'boolean', to: 'number' },
	{ from: 'date', to: 'text' },
	{ from: 'json', to: 'text' },
];

function canChangeTypeWithoutQuery(oldColumn: DBColumn, newColumn: DBColumn) {
	return typeChangesWithoutQuery.some(
		({ from, to }) => oldColumn.type === from && newColumn.type === to
	);
}

// Using `DBColumn` will not narrow `default` based on the column `type`
// Handle each column separately
type WithDefaultDefined<T extends DBColumn> = T & Required<Pick<T['schema'], 'default'>>;
type DBColumnWithDefault =
	| WithDefaultDefined<TextColumn>
	| WithDefaultDefined<DateColumn>
	| WithDefaultDefined<NumberColumn>
	| WithDefaultDefined<BooleanColumn>
	| WithDefaultDefined<JsonColumn>;

function hasRuntimeDefault(column: DBColumn): column is DBColumnWithDefault {
	return !!(column.schema.default && isSerializedSQL(column.schema.default));
}

export async function getProductionCurrentSnapshot({
	appToken,
}: {
	appToken: string;
}): Promise<DBSnapshot | undefined> {
	const url = new URL('/db/schema', getRemoteDatabaseUrl());

	const response = await safeFetch(
		url,
		{
			method: 'POST',
			headers: new Headers({
				Authorization: `Bearer ${appToken}`,
			}),
		},
		async (res) => {
			console.error(`${url.toString()} failed: ${res.status} ${res.statusText}`);
			console.error(await res.text());
			throw new Error(`/db/schema fetch failed: ${res.status} ${res.statusText}`);
		}
	);

	const result = (await response.json()) as Result<DBSnapshot>;
	if (!result.success) {
		console.error(`${url.toString()} unsuccessful`);
		console.error(await response.text());
		throw new Error(`/db/schema fetch unsuccessful`);
	}
	return result.data;
}

export function createCurrentSnapshot({ tables = {} }: DBConfig): DBSnapshot {
	const schema = JSON.parse(JSON.stringify(tables));
	return { version: MIGRATION_VERSION, schema };
}

export function createEmptySnapshot(): DBSnapshot {
	return { version: MIGRATION_VERSION, schema: {} };
}

export function formatDataLossMessage(confirmations: string[], isColor = true): string {
	const messages = [];
	messages.push(color.red('✖ We found some schema changes that cannot be handled automatically:'));
	messages.push(``);
	messages.push(...confirmations.map((m, i) => color.red(`  (${i + 1}) `) + m));
	messages.push(``);
	messages.push(`To resolve, revert these changes or update your schema, and re-run the command.`);
	messages.push(
		`You may also run 'astro db push --force-reset' to ignore all warnings and force-push your local database schema to production instead. All data will be lost and the database will be reset.`
	);
	let finalMessage = messages.join('\n');
	if (!isColor) {
		finalMessage = stripAnsi(finalMessage);
	}
	return finalMessage;
}
