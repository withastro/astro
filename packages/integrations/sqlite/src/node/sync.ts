import { lastModifiedKey } from '../runtime/query.js';
import { quoteIdentifier, sqlLiteral, tableName } from '../runtime/sql.js';
import { META_TABLE, SCHEMA_VERSION, type SqlValue } from '../runtime/types.js';
import type { StoredCollections } from './data-store.js';
import { type EntryRow, serializeEntry } from './serialize.js';

/**
 * Where a sync writes to. The local database and the D1 HTTP API both implement
 * this, so the same incremental sync runs in development, at build time, and when
 * pushing to a remote database.
 */
export interface SqlExecutor {
	query(sql: string, params?: SqlValue[]): Promise<Array<Record<string, unknown>>>;
	/** Executes self-contained statements (no parameters), atomically where the target allows it. */
	execute(statements: string[]): Promise<void>;
}

export interface SyncOptions {
	tablePrefix: string;
	/** Only mirror these collections. Defaults to every collection in the store. */
	collections?: string[];
	/** Drop every mirrored table before writing, instead of diffing against what is there. */
	reset?: boolean;
}

export interface SyncResult {
	/** Whether any statement was executed. */
	changed: boolean;
	/** Per collection, how many rows were written and deleted. */
	collections: Record<string, { upserted: number; deleted: number }>;
}

const TABLES_KEY = 'tables';
const SCHEMA_VERSION_KEY = 'schemaVersion';

/**
 * Brings the target database in line with the content layer's data store by
 * comparing per-row digests, so an unchanged entry costs one row of a `SELECT`
 * and nothing else.
 */
export async function syncCollections(
	executor: SqlExecutor,
	store: StoredCollections,
	options: SyncOptions,
): Promise<SyncResult> {
	const { tablePrefix } = options;
	const result: SyncResult = { changed: false, collections: {} };
	const meta = quoteIdentifier(META_TABLE);

	await executor.execute([
		`CREATE TABLE IF NOT EXISTS ${meta} ("key" TEXT PRIMARY KEY, "value" TEXT NOT NULL)`,
	]);
	const metaRows = await executor.query(`SELECT "key", "value" FROM ${meta}`);
	const metaMap = new Map(metaRows.map((row) => [String(row.key), String(row.value)]));
	let knownTables: string[] = JSON.parse(metaMap.get(TABLES_KEY) ?? '[]');

	if (options.reset || metaMap.get(SCHEMA_VERSION_KEY) !== SCHEMA_VERSION) {
		if (knownTables.length > 0) {
			await executor.execute(
				knownTables.map((table) => `DROP TABLE IF EXISTS ${quoteIdentifier(table)}`),
			);
			result.changed = true;
		}
		await executor.execute([
			`DELETE FROM ${meta}`,
			`INSERT INTO ${meta} ("key", "value") VALUES (${sqlLiteral(SCHEMA_VERSION_KEY)}, ${sqlLiteral(SCHEMA_VERSION)})`,
		]);
		knownTables = [];
	}

	const wanted = options.collections
		? [...store.keys()].filter((name) => options.collections!.includes(name))
		: [...store.keys()];
	const now = new Date().toISOString();

	for (const collection of wanted) {
		const table = quoteIdentifier(tableName(tablePrefix, collection));
		await executor.execute([
			`CREATE TABLE IF NOT EXISTS ${table} ("id" TEXT PRIMARY KEY, "data" TEXT NOT NULL, "meta" TEXT NOT NULL, "rendered" TEXT, "digest" TEXT NOT NULL)`,
		]);
		const existing = new Map(
			(await executor.query(`SELECT "id", "digest" FROM ${table}`)).map((row) => [
				String(row.id),
				String(row.digest),
			]),
		);

		const statements: string[] = [];
		let upserted = 0;
		for (const entry of store.get(collection)!.values()) {
			const row = serializeEntry(entry);
			if (existing.get(row.id) === row.digest) {
				existing.delete(row.id);
				continue;
			}
			existing.delete(row.id);
			statements.push(upsertStatement(table, row));
			upserted++;
		}
		const deleted = existing.size;
		for (const id of existing.keys()) {
			statements.push(`DELETE FROM ${table} WHERE "id" = ${sqlLiteral(id)}`);
		}
		if (statements.length > 0) {
			statements.push(
				`INSERT OR REPLACE INTO ${meta} ("key", "value") VALUES (${sqlLiteral(lastModifiedKey(collection))}, ${sqlLiteral(now)})`,
			);
			await executor.execute(statements);
			result.changed = true;
		} else if (!metaMap.has(lastModifiedKey(collection))) {
			await executor.execute([
				`INSERT OR REPLACE INTO ${meta} ("key", "value") VALUES (${sqlLiteral(lastModifiedKey(collection))}, ${sqlLiteral(now)})`,
			]);
		}
		result.collections[collection] = { upserted, deleted };
	}

	// Drop tables of collections that no longer exist, but only ones this integration created.
	const currentTables = wanted.map((collection) => tableName(tablePrefix, collection));
	const stale = knownTables.filter((table) => !currentTables.includes(table));
	if (stale.length > 0) {
		await executor.execute(stale.map((table) => `DROP TABLE IF EXISTS ${quoteIdentifier(table)}`));
		result.changed = true;
	}
	const tablesValue = JSON.stringify(currentTables);
	if (metaMap.get(TABLES_KEY) !== tablesValue) {
		await executor.execute([
			`INSERT OR REPLACE INTO ${meta} ("key", "value") VALUES (${sqlLiteral(TABLES_KEY)}, ${sqlLiteral(tablesValue)})`,
		]);
	}
	return result;
}

/**
 * Statements that rebuild the mirrored tables from scratch. Used when a remote
 * database cannot be queried at build time, so the user can apply them by hand.
 */
export function dumpCollections(store: StoredCollections, options: SyncOptions): string[] {
	const { tablePrefix } = options;
	const meta = quoteIdentifier(META_TABLE);
	const now = new Date().toISOString();
	const wanted = options.collections
		? [...store.keys()].filter((name) => options.collections!.includes(name))
		: [...store.keys()];
	const statements = [
		`CREATE TABLE IF NOT EXISTS ${meta} ("key" TEXT PRIMARY KEY, "value" TEXT NOT NULL)`,
		`DELETE FROM ${meta}`,
		`INSERT INTO ${meta} ("key", "value") VALUES (${sqlLiteral(SCHEMA_VERSION_KEY)}, ${sqlLiteral(SCHEMA_VERSION)})`,
		`INSERT INTO ${meta} ("key", "value") VALUES (${sqlLiteral(TABLES_KEY)}, ${sqlLiteral(JSON.stringify(wanted.map((c) => tableName(tablePrefix, c))))})`,
	];
	for (const collection of wanted) {
		const table = quoteIdentifier(tableName(tablePrefix, collection));
		statements.push(
			`DROP TABLE IF EXISTS ${table}`,
			`CREATE TABLE ${table} ("id" TEXT PRIMARY KEY, "data" TEXT NOT NULL, "meta" TEXT NOT NULL, "rendered" TEXT, "digest" TEXT NOT NULL)`,
		);
		for (const entry of store.get(collection)!.values()) {
			statements.push(upsertStatement(table, serializeEntry(entry)));
		}
		statements.push(
			`INSERT INTO ${meta} ("key", "value") VALUES (${sqlLiteral(lastModifiedKey(collection))}, ${sqlLiteral(now)})`,
		);
	}
	return statements;
}

function upsertStatement(table: string, row: EntryRow): string {
	return `INSERT OR REPLACE INTO ${table} ("id", "data", "meta", "rendered", "digest") VALUES (${sqlLiteral(row.id)}, ${sqlLiteral(row.data)}, ${sqlLiteral(row.meta)}, ${sqlLiteral(row.rendered)}, ${sqlLiteral(row.digest)})`;
}
