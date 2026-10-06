import { type Client, createClient, type Row } from '@libsql/client';
import type { ContentStorageDriver, ContentStorageDriverFactory, SerializedEntry } from 'astro';
import { parseConfig, type SqliteContentStorageConfig } from './config.js';

const ENTRIES_TABLE = 'astro_content_entries';
const META_TABLE = 'astro_content_meta';

// `values()` reads the entries of a collection in pages of this size, so a large collection
// isn't loaded in memory at once
const PAGE_SIZE = 500;

/**
 * Creates a content storage driver that saves collections in a SQLite or libSQL database.
 * The tables it needs are created on first use.
 */
function createSqliteDriver(config: SqliteContentStorageConfig): ContentStorageDriver {
	let client: Client;
	try {
		// A local database file is opened here, so a missing folder or a permission problem fails now
		client = createClient({ url: config.url, authToken: config.token });
	} catch (error) {
		throw createDriverError('could not connect to the database', error);
	}
	let ready: Promise<void> | undefined;

	async function createTables() {
		try {
			await client.batch(
				[
					`CREATE TABLE IF NOT EXISTS ${ENTRIES_TABLE} (
						collection TEXT NOT NULL,
						id TEXT NOT NULL,
						metadata TEXT NOT NULL,
						content TEXT,
						PRIMARY KEY (collection, id)
					) WITHOUT ROWID`,
					`CREATE TABLE IF NOT EXISTS ${META_TABLE} (
						collection TEXT NOT NULL,
						key TEXT NOT NULL,
						value TEXT NOT NULL,
						PRIMARY KEY (collection, key)
					) WITHOUT ROWID`,
				],
				'write',
			);
		} catch (error) {
			// The next call tries again, for example once a remote database is reachable
			ready = undefined;
			throw createDriverError('could not create its tables in the database', error);
		}
	}

	/**
	 * Runs one SQL statement, after the tables are created.
	 * When the statement fails, the error says which `operation` failed.
	 */
	async function execute(operation: string, sql: string, args: Array<string | null>) {
		await (ready ??= createTables());
		try {
			return await client.execute({ sql, args });
		} catch (error) {
			throw createDriverError(`could not ${operation}`, error);
		}
	}

	return {
		async hasCollection(collection) {
			const { rows } = await execute(
				`check if the collection "${collection}" has entries`,
				`SELECT 1 FROM ${ENTRIES_TABLE} WHERE collection = ? LIMIT 1`,
				[collection],
			);
			return rows.length > 0;
		},
		async get(collection, id, { content }) {
			const { rows } = await execute(
				`read the entry "${id}" of the collection "${collection}"`,
				`SELECT id, metadata${content ? ', content' : ''} FROM ${ENTRIES_TABLE} WHERE collection = ? AND id = ?`,
				[collection, id],
			);
			return rows[0] && toEntry(rows[0]);
		},
		async keys(collection) {
			const { rows } = await execute(
				`read the entry IDs of the collection "${collection}"`,
				`SELECT id FROM ${ENTRIES_TABLE} WHERE collection = ?`,
				[collection],
			);
			return rows.map((row) => String(row.id));
		},
		async *values(collection, { content }) {
			const operation = `read the entries of the collection "${collection}"`;
			const columns = `id, metadata${content ? ', content' : ''}`;
			let lastId: string | undefined;
			while (true) {
				const { rows } =
					lastId === undefined
						? await execute(
								operation,
								`SELECT ${columns} FROM ${ENTRIES_TABLE} WHERE collection = ? ORDER BY id LIMIT ${PAGE_SIZE}`,
								[collection],
							)
						: await execute(
								operation,
								`SELECT ${columns} FROM ${ENTRIES_TABLE} WHERE collection = ? AND id > ? ORDER BY id LIMIT ${PAGE_SIZE}`,
								[collection, lastId],
							);
				for (const row of rows) {
					yield toEntry(row);
				}
				if (rows.length < PAGE_SIZE) {
					return;
				}
				lastId = String(rows.at(-1)!.id);
			}
		},
		async set(collection, { id, metadata, content }) {
			await execute(
				`save the entry "${id}" of the collection "${collection}"`,
				`INSERT INTO ${ENTRIES_TABLE} (collection, id, metadata, content) VALUES (?, ?, ?, ?)
				ON CONFLICT (collection, id) DO UPDATE SET metadata = excluded.metadata, content = excluded.content`,
				[collection, id, metadata, content ?? null],
			);
		},
		async delete(collection, id) {
			await execute(
				`delete the entry "${id}" of the collection "${collection}"`,
				`DELETE FROM ${ENTRIES_TABLE} WHERE collection = ? AND id = ?`,
				[collection, id],
			);
		},
		async clear(collection) {
			await execute(
				`delete the entries of the collection "${collection}"`,
				`DELETE FROM ${ENTRIES_TABLE} WHERE collection = ?`,
				[collection],
			);
		},
		async getMeta(collection, key) {
			const { rows } = await execute(
				`read the meta value "${key}" of the collection "${collection}"`,
				`SELECT value FROM ${META_TABLE} WHERE collection = ? AND key = ?`,
				[collection, key],
			);
			return rows[0] && String(rows[0].value);
		},
		async setMeta(collection, key, value) {
			await execute(
				`save the meta value "${key}" of the collection "${collection}"`,
				`INSERT INTO ${META_TABLE} (collection, key, value) VALUES (?, ?, ?)
				ON CONFLICT (collection, key) DO UPDATE SET value = excluded.value`,
				[collection, key, value],
			);
		},
		async deleteMeta(collection, key) {
			await execute(
				`delete the meta value "${key}" of the collection "${collection}"`,
				`DELETE FROM ${META_TABLE} WHERE collection = ? AND key = ?`,
				[collection, key],
			);
		},
		async clearMeta(collection) {
			await execute(
				`delete the meta values of the collection "${collection}"`,
				`DELETE FROM ${META_TABLE} WHERE collection = ?`,
				[collection],
			);
		},
		async close() {
			client.close();
		},
	};
}

/** Returns an error that says what the driver was doing, followed by the reason it failed */
function createDriverError(problem: string, cause: unknown) {
	const reason = cause instanceof Error ? cause.message : String(cause);
	return new Error(`The SQLite content storage driver ${problem}. ${reason}`, { cause });
}

function toEntry(row: Row): SerializedEntry {
	const entry: SerializedEntry = { id: String(row.id), metadata: String(row.metadata) };
	if (typeof row.content === 'string') {
		entry.content = row.content;
	}
	return entry;
}

const createDriver: ContentStorageDriverFactory = (config) =>
	createSqliteDriver(parseConfig(config));

export default createDriver;
