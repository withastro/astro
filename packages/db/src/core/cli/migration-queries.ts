import { stripVTControlCharacters } from 'node:util';
import deepDiff from 'deep-diff';
import { sql } from 'drizzle-orm';
import * as color from 'kleur/colors';
import { createRemoteDatabaseClient } from '../../runtime/index.js';
import { hasPrimaryKey, isDbError, safeFetch } from '../../runtime/utils.js';
import { MIGRATION_VERSION } from '../consts.js';
import { RENAME_COLUMN_ERROR, RENAME_TABLE_ERROR } from '../errors.js';
import { columnSchema } from '../schemas.js';
import type {
	ColumnType,
	DBColumn,
	DBColumns,
	DBConfig,
	DBSnapshot,
	ResolvedDBTable,
	ResolvedDBTables,
} from '../types.js';
import type { RemoteDatabaseInfo, Result } from '../utils.js';
import type { DatabaseBackend } from '../backend/types.js';
import { getAdded, getDropped, hasDefault } from '../backend/utils.js';

export async function getMigrationOps<Op>({
	oldSnapshot,
	newSnapshot,
	backend,
	reset = false,
}: {
	oldSnapshot: DBSnapshot;
	newSnapshot: DBSnapshot;
	backend: DatabaseBackend<Op>;
	reset?: boolean;
}): Promise<{ queries: Op[]; confirmations: string[] }> {
	const queries: Op[] = [];
	const confirmations: string[] = [];

	// When doing a reset, first create DROP TABLE statements, then treat everything
	// else as creation.
	if (reset) {
		const currentSnapshot = oldSnapshot;
		oldSnapshot = createEmptySnapshot();
		queries.push(...getDropTableOpsForSnapshot(backend, currentSnapshot));
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
		queries.push(
			...backend.getCreateTableOps(tableName, table),
			...backend.getCreateIndexOps(tableName, table),
		);
	}

	for (const [tableName] of Object.entries(droppedTables)) {
		queries.push(...backend.getDropTableIfExistsOps(tableName));
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
			backend,
		});
		queries.push(...result.queries);
		confirmations.push(...result.confirmations);
	}
	return { queries, confirmations };
}

export async function getTableChangeQueries<Op>({
	tableName,
	oldTable,
	newTable,
	backend,
}: {
	tableName: string;
	oldTable: ResolvedDBTable;
	newTable: ResolvedDBTable;
	backend: DatabaseBackend<Op>
}): Promise<{ queries: Op[]; confirmations: string[] }> {
	const queries: Op[] = [];
	const confirmations: string[] = [];
	const updated = getUpdatedColumns(oldTable.columns, newTable.columns);
	const added = getAdded(oldTable.columns, newTable.columns);
	const dropped = getDropped(oldTable.columns, newTable.columns);
	/** Any foreign key changes require a full table recreate */
	const hasForeignKeyChanges = Boolean(deepDiff(oldTable.foreignKeys, newTable.foreignKeys));

	if (!hasForeignKeyChanges && isEmpty(updated) && isEmpty(added) && isEmpty(dropped)) {
		return {
			queries: backend.getChangeIndexOps({
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
		Object.values(dropped).every(column => backend.canAlterTableDropColumn(column)) &&
		Object.values(added).every(column => backend.canAlterTableAddColumn(column))
	) {
		queries.push(
			...backend.getAlterTableOps(tableName, added, dropped),
			...backend.getChangeIndexOps({
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
		const reasonMsgs: Record<DataLossReason, string> = {
			'added-required': `You added new required column '${color.bold(
				tableName + '.' + columnName,
			)}' with no default value.\n      This cannot be executed on an existing table.`,
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

	const recreateTableQueries = backend.getRecreateTableOps({
		tableName,
		newTable,
		added,
		hasDataLoss: dataLossCheck.dataLoss,
		migrateHiddenPrimaryKey: !primaryKeyExists && !droppedPrimaryKey,
	});
	queries.push(...recreateTableQueries, ...backend.getCreateIndexOps(tableName, newTable));
	return { queries, confirmations };
}

function getAddedTables(oldTables: DBSnapshot, newTables: DBSnapshot): ResolvedDBTables {
	const added: ResolvedDBTables = {};
	for (const [key, newTable] of Object.entries(newTables.schema)) {
		if (!(key in oldTables.schema)) added[key] = newTable;
	}
	return added;
}

function getDroppedTables(oldTables: DBSnapshot, newTables: DBSnapshot): ResolvedDBTables {
	const dropped: ResolvedDBTables = {};
	for (const [key, oldTable] of Object.entries(oldTables.schema)) {
		if (!(key in newTables.schema)) dropped[key] = oldTable;
	}
	return dropped;
}

function isEmpty(obj: Record<string, unknown>) {
	return Object.keys(obj).length === 0;
}

type DataLossReason = 'added-required' | 'updated-type';
type DataLossResponse =
	| { dataLoss: false }
	| { dataLoss: true; columnName: string; reason: DataLossReason };

function canRecreateTableWithoutDataLoss(
	added: DBColumns,
	updated: UpdatedColumns,
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
		({ from, to }) => oldColumn.type === from && newColumn.type === to,
	);
}

export function getProductionCurrentSnapshot(options: {
	dbInfo: RemoteDatabaseInfo;
	appToken: string;
}): Promise<DBSnapshot | undefined> {
	return options.dbInfo.type === 'studio'
		? getStudioCurrentSnapshot(options.appToken, options.dbInfo.url)
		: getDbCurrentSnapshot(options.appToken, options.dbInfo.url);
}

async function getDbCurrentSnapshot(
	appToken: string,
	remoteUrl: string,
): Promise<DBSnapshot | undefined> {
	const client = createRemoteDatabaseClient({
		dbType: 'libsql',
		appToken,
		remoteUrl,
	});

	try {
		const res = await client.get<{ snapshot: string }>(
			// Latest snapshot
			sql`select snapshot from _astro_db_snapshot order by id desc limit 1;`,
		);

		return JSON.parse(res.snapshot);
	} catch (error) {
		// Don't handle errors that are not from libSQL
		if (
			isDbError(error) &&
			// If the schema was never pushed to the database yet the table won't exist.
			// Treat a missing snapshot table as an empty table.

			// When connecting to a remote database in that condition
			// the query will fail with the following error code and message.
			((error.code === 'SQLITE_UNKNOWN' &&
				error.message === 'SQLITE_UNKNOWN: SQLite error: no such table: _astro_db_snapshot') ||
				// When connecting to a local or in-memory database that does not have a snapshot table yet
				// the query will fail with the following error code and message.
				(error.code === 'SQLITE_ERROR' &&
					error.message === 'SQLITE_ERROR: no such table: _astro_db_snapshot'))
		) {
			return;
		}

		throw error;
	}
}

async function getStudioCurrentSnapshot(
	appToken: string,
	remoteUrl: string,
): Promise<DBSnapshot | undefined> {
	const url = new URL('/db/schema', remoteUrl);

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
		},
	);

	const result = (await response.json()) as Result<DBSnapshot>;
	if (!result.success) {
		console.error(`${url.toString()} unsuccessful`);
		console.error(await response.text());
		throw new Error(`/db/schema fetch unsuccessful`);
	}
	return result.data;
}

function getDropTableOpsForSnapshot<Op>(backend: DatabaseBackend<Op>, snapshot: DBSnapshot): Op[] {
	const queries: Op[] = [];
	for (const tableName of Object.keys(snapshot.schema)) {
		const dropQuery = backend.getDropTableIfExistsOps(tableName);
		queries.unshift(...dropQuery);
	}
	return queries;
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
		`You may also run 'astro db push --force-reset' to ignore all warnings and force-push your local database schema to production instead. All data will be lost and the database will be reset.`,
	);
	let finalMessage = messages.join('\n');
	if (!isColor) {
		finalMessage = stripVTControlCharacters(finalMessage);
	}
	return finalMessage;
}
