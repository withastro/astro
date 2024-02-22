import * as color from 'kleur/colors';
import deepDiff from 'deep-diff';
import {
	columnSchema,
	type BooleanColumn,
	type DBTable,
	type DBTables,
	type DBColumn,
	type DBColumns,
	type DBSnapshot,
	type DateColumn,
	type ColumnType,
	type Indexes,
	type JsonColumn,
	type NumberColumn,
	type TextColumn,
} from '../types.js';
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core';
import { customAlphabet } from 'nanoid';
import prompts from 'prompts';
import {
	getCreateIndexQueries,
	getCreateTableQuery,
	getModifiers,
	getReferencesConfig,
	hasDefault,
	schemaTypeToSqlType,
} from '../queries.js';
import { hasPrimaryKey } from '../../runtime/index.js';
import { isSerializedSQL } from '../../runtime/types.js';

const sqlite = new SQLiteAsyncDialect();
const genTempTableName = customAlphabet('abcdefghijklmnopqrstuvwxyz', 10);

/** Dependency injected for unit testing */
type AmbiguityResponses = {
	collectionRenames: Record<string, string>;
	columnRenames: {
		[collectionName: string]: Record<string, string>;
	};
};

export async function getMigrationQueries({
	oldSnapshot,
	newSnapshot,
	ambiguityResponses,
}: {
	oldSnapshot: DBSnapshot;
	newSnapshot: DBSnapshot;
	ambiguityResponses?: AmbiguityResponses;
}): Promise<{ queries: string[]; confirmations: string[] }> {
	const queries: string[] = [];
	const confirmations: string[] = [];
	let added = getAddedCollections(oldSnapshot, newSnapshot);
	let dropped = getDroppedCollections(oldSnapshot, newSnapshot);
	if (!isEmpty(added) && !isEmpty(dropped)) {
		const resolved = await resolveCollectionRenames(added, dropped, ambiguityResponses);
		added = resolved.added;
		dropped = resolved.dropped;
		for (const { from, to } of resolved.renamed) {
			const renameQuery = `ALTER TABLE ${sqlite.escapeName(from)} RENAME TO ${sqlite.escapeName(
				to
			)}`;
			queries.push(renameQuery);
		}
	}

	for (const [collectionName, collection] of Object.entries(added)) {
		queries.push(getCreateTableQuery(collectionName, collection));
		queries.push(...getCreateIndexQueries(collectionName, collection));
	}

	for (const [collectionName] of Object.entries(dropped)) {
		const dropQuery = `DROP TABLE ${sqlite.escapeName(collectionName)}`;
		queries.push(dropQuery);
	}

	for (const [collectionName, newCollection] of Object.entries(newSnapshot.schema)) {
		const oldCollection = oldSnapshot.schema[collectionName];
		if (!oldCollection) continue;
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
	ambiguityResponses,
}: {
	collectionName: string;
	oldCollection: DBTable;
	newCollection: DBTable;
	ambiguityResponses?: AmbiguityResponses;
}): Promise<{ queries: string[]; confirmations: string[] }> {
	const queries: string[] = [];
	const confirmations: string[] = [];
	const updated = getUpdatedColumns(oldCollection.columns, newCollection.columns);
	let added = getAdded(oldCollection.columns, newCollection.columns);
	let dropped = getDropped(oldCollection.columns, newCollection.columns);
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
	if (!hasForeignKeyChanges && !isEmpty(added) && !isEmpty(dropped)) {
		const resolved = await resolveColumnRenames(collectionName, added, dropped, ambiguityResponses);
		added = resolved.added;
		dropped = resolved.dropped;
		queries.push(...getColumnRenameQueries(collectionName, resolved.renamed));
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
			'added-required': `New column ${color.bold(
				collectionName + '.' + columnName
			)} is required with no default value.\nThis requires deleting existing data in the ${color.bold(
				collectionName
			)} collection.`,
			'added-unique': `New column ${color.bold(
				collectionName + '.' + columnName
			)} is marked as unique.\nThis requires deleting existing data in the ${color.bold(
				collectionName
			)} collection.`,
			'updated-type': `Updated column ${color.bold(
				collectionName + '.' + columnName
			)} cannot convert data to new column data type.\nThis requires deleting existing data in the ${color.bold(
				collectionName
			)} collection.`,
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

type Renamed = Array<{ from: string; to: string }>;

async function resolveColumnRenames(
	collectionName: string,
	mightAdd: DBColumns,
	mightDrop: DBColumns,
	ambiguityResponses?: AmbiguityResponses
): Promise<{ added: DBColumns; dropped: DBColumns; renamed: Renamed }> {
	const added: DBColumns = {};
	const dropped: DBColumns = {};
	const renamed: Renamed = [];

	for (const [columnName, column] of Object.entries(mightAdd)) {
		let oldColumnName = ambiguityResponses
			? ambiguityResponses.columnRenames[collectionName]?.[columnName] ?? '__NEW__'
			: undefined;
		if (!oldColumnName) {
			const res = await prompts(
				{
					type: 'select',
					name: 'columnName',
					message:
						'New column ' +
						color.blue(color.bold(`${collectionName}.${columnName}`)) +
						' detected. Was this renamed from an existing column?',
					choices: [
						{ title: 'New column (not renamed from existing)', value: '__NEW__' },
						...Object.keys(mightDrop)
							.filter((key) => !(key in renamed))
							.map((key) => ({ title: key, value: key })),
					],
				},
				{
					onCancel: () => {
						process.exit(1);
					},
				}
			);
			oldColumnName = res.columnName as string;
		}

		if (oldColumnName === '__NEW__') {
			added[columnName] = column;
		} else {
			renamed.push({ from: oldColumnName, to: columnName });
		}
	}
	for (const [droppedColumnName, droppedColumn] of Object.entries(mightDrop)) {
		if (!renamed.find((r) => r.from === droppedColumnName)) {
			dropped[droppedColumnName] = droppedColumn;
		}
	}

	return { added, dropped, renamed };
}

async function resolveCollectionRenames(
	mightAdd: DBTables,
	mightDrop: DBTables,
	ambiguityResponses?: AmbiguityResponses
): Promise<{ added: DBTables; dropped: DBTables; renamed: Renamed }> {
	const added: DBTables = {};
	const dropped: DBTables = {};
	const renamed: Renamed = [];

	for (const [collectionName, collection] of Object.entries(mightAdd)) {
		let oldCollectionName = ambiguityResponses
			? ambiguityResponses.collectionRenames[collectionName] ?? '__NEW__'
			: undefined;
		if (!oldCollectionName) {
			const res = await prompts(
				{
					type: 'select',
					name: 'collectionName',
					message:
						'New collection ' +
						color.blue(color.bold(collectionName)) +
						' detected. Was this renamed from an existing collection?',
					choices: [
						{ title: 'New collection (not renamed from existing)', value: '__NEW__' },
						...Object.keys(mightDrop)
							.filter((key) => !(key in renamed))
							.map((key) => ({ title: key, value: key })),
					],
				},
				{
					onCancel: () => {
						process.exit(1);
					},
				}
			);
			oldCollectionName = res.collectionName as string;
		}

		if (oldCollectionName === '__NEW__') {
			added[collectionName] = collection;
		} else {
			renamed.push({ from: oldCollectionName, to: collectionName });
		}
	}

	for (const [droppedCollectionName, droppedCollection] of Object.entries(mightDrop)) {
		if (!renamed.find((r) => r.from === droppedCollectionName)) {
			dropped[droppedCollectionName] = droppedCollection;
		}
	}

	return { added, dropped, renamed };
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

function getColumnRenameQueries(unescapedCollectionName: string, renamed: Renamed): string[] {
	const queries: string[] = [];
	const collectionName = sqlite.escapeName(unescapedCollectionName);

	for (const { from, to } of renamed) {
		const q = `ALTER TABLE ${collectionName} RENAME COLUMN ${sqlite.escapeName(
			from
		)} TO ${sqlite.escapeName(to)}`;
		queries.push(q);
	}

	return queries;
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

type DataLossReason = 'added-required' | 'added-unique' | 'updated-type';
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
		if (!a.schema.optional && a.schema.unique) {
			return { dataLoss: true, columnName, reason: 'added-unique' };
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
