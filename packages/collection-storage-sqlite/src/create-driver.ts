import type { Client, Config, InStatement, Row } from '@libsql/client';
import type { CollectionStorageDriver, StoredEntry } from 'astro';
import type { SqliteConfig } from './index.js';

const SNAPSHOTS_TABLE = 'astro_collection_snapshots';
const ENTRIES_TABLE = 'astro_collection_entries';

// Entries are written and read in pages of this size, so each database request stays small
const PAGE_SIZE = 500;

/**
 * Creates a collection storage driver with the libSQL client of the current runtime, reading
 * the auth token with `getSecret`. Snapshots share two tables, created on first use: an entry
 * belongs to a snapshot, and a snapshot is listed in the snapshots table only once its writer
 * committed it.
 */
export function createSqliteDriver(
	createClient: (config: Config) => Client,
	config: unknown,
	getSecret: (name: string) => string | undefined,
): CollectionStorageDriver {
	const { url, authTokenEnv } = parseConfig(config);
	const authToken = authTokenEnv ? getSecret(authTokenEnv) : undefined;
	let client: Client;
	try {
		client = createClient({ url, authToken });
	} catch (error) {
		throw createDriverError('could not connect to the database', error);
	}

	let ready: Promise<void> | undefined;
	async function createTables() {
		try {
			await client.batch(
				[
					`CREATE TABLE IF NOT EXISTS ${SNAPSHOTS_TABLE} (
						snapshot TEXT PRIMARY KEY,
						committed_at TEXT NOT NULL,
						dev INTEGER NOT NULL
					) WITHOUT ROWID`,
					`CREATE TABLE IF NOT EXISTS ${ENTRIES_TABLE} (
						snapshot TEXT NOT NULL,
						collection TEXT NOT NULL,
						id TEXT NOT NULL,
						metadata TEXT NOT NULL,
						content TEXT,
						PRIMARY KEY (snapshot, collection, id)
					) WITHOUT ROWID`,
				],
				'write',
			);
		} catch (error) {
			// The next call tries again, for example once a remote database is reachable
			ready = undefined;
			throw createDriverError('could not create its tables', error);
		}
	}

	async function run<T>(operation: string, task: () => Promise<T>): Promise<T> {
		await (ready ??= createTables());
		try {
			return await task();
		} catch (error) {
			throw createDriverError(`could not ${operation}`, error);
		}
	}

	return {
		async openWriter({ snapshot, dev }) {
			// A dev server writes its snapshot again after each change: the entries it wrote
			// before are replaced by the ones written now
			await run(`clear the snapshot "${snapshot}"`, () =>
				client.execute({
					sql: `DELETE FROM ${ENTRIES_TABLE} WHERE snapshot = ?`,
					args: [snapshot],
				}),
			);
			return {
				async write(collection, entries) {
					const operation = `write the collection "${collection}" to the snapshot "${snapshot}"`;
					for (let start = 0; start < entries.length; start += PAGE_SIZE) {
						const statements: InStatement[] = entries
							.slice(start, start + PAGE_SIZE)
							.map(({ id, metadata, content }) => ({
								sql: `INSERT OR REPLACE INTO ${ENTRIES_TABLE} (snapshot, collection, id, metadata, content) VALUES (?, ?, ?, ?, ?)`,
								args: [snapshot, collection, id, metadata, content ?? null],
							}));
						await run(operation, () => client.batch(statements, 'write'));
					}
				},
				async commit() {
					await run(`commit the snapshot "${snapshot}"`, () =>
						client.execute({
							sql: `INSERT INTO ${SNAPSHOTS_TABLE} (snapshot, committed_at, dev) VALUES (?, ?, ?)
								ON CONFLICT (snapshot) DO UPDATE SET committed_at = excluded.committed_at`,
							args: [snapshot, new Date().toISOString(), dev ? 1 : 0],
						}),
					);
				},
			};
		},
		async listSnapshots() {
			const { rows } = await run('list the snapshots', () =>
				client.execute(`SELECT snapshot, committed_at, dev FROM ${SNAPSHOTS_TABLE}`),
			);
			return rows.map((row) => ({
				snapshot: String(row.snapshot),
				committedAt: new Date(String(row.committed_at)),
				dev: Boolean(row.dev),
			}));
		},
		async deleteSnapshot(snapshot) {
			await run(`delete the snapshot "${snapshot}"`, () =>
				client.batch(
					[
						{ sql: `DELETE FROM ${ENTRIES_TABLE} WHERE snapshot = ?`, args: [snapshot] },
						{ sql: `DELETE FROM ${SNAPSHOTS_TABLE} WHERE snapshot = ?`, args: [snapshot] },
					],
					'write',
				),
			);
		},
		async openReader({ snapshot }) {
			const committed = await run(`read the snapshot "${snapshot}"`, () =>
				client.execute({
					sql: `SELECT 1 FROM ${SNAPSHOTS_TABLE} WHERE snapshot = ?`,
					args: [snapshot],
				}),
			);
			if (committed.rows.length === 0) {
				throw createDriverError(
					`could not find the snapshot "${snapshot}"`,
					'It was never committed, or it was deleted from the database.',
				);
			}
			const columns = (content: boolean) => `id, metadata${content ? ', content' : ''}`;
			return {
				async get(collection, id, { content }) {
					const { rows } = await run(
						`read the entry "${id}" of the collection "${collection}"`,
						() =>
							client.execute({
								sql: `SELECT ${columns(content)} FROM ${ENTRIES_TABLE} WHERE snapshot = ? AND collection = ? AND id = ?`,
								args: [snapshot, collection, id],
							}),
					);
					return rows[0] && toStoredEntry(rows[0]);
				},
				async entries(collection, { content }) {
					const operation = `read the entries of the collection "${collection}"`;
					const entries: StoredEntry[] = [];
					let lastId = '';
					while (true) {
						const { rows } = await run(operation, () =>
							client.execute({
								sql: `SELECT ${columns(content)} FROM ${ENTRIES_TABLE} WHERE snapshot = ? AND collection = ? AND id > ? ORDER BY id LIMIT ${PAGE_SIZE}`,
								args: [snapshot, collection, lastId],
							}),
						);
						for (const row of rows) entries.push(toStoredEntry(row));
						if (rows.length < PAGE_SIZE) return entries;
						lastId = String(rows.at(-1)!.id);
					}
				},
			};
		},
	};
}

/**
 * Checks the config received by the driver.
 *
 * @throws {Error} When `url` is missing, or an option has the wrong type.
 */
function parseConfig(config: unknown): SqliteConfig {
	const { url, authTokenEnv } = (config ?? {}) as Partial<SqliteConfig>;
	if (typeof url !== 'string' || url === '') {
		throw new Error(
			'The SQLite collection storage driver needs the URL of a database. Pass `url` to `sqlite()`.',
		);
	}
	if (authTokenEnv !== undefined && typeof authTokenEnv !== 'string') {
		throw new Error(
			'The `authTokenEnv` option of `sqlite()` must be the name of an environment variable.',
		);
	}
	return { url, authTokenEnv };
}

/** Returns an error that says what the driver was doing, followed by the reason it failed. */
function createDriverError(problem: string, cause: unknown) {
	const reason = cause instanceof Error ? cause.message : String(cause);
	return new Error(`The SQLite collection storage driver ${problem}. ${reason}`, { cause });
}

function toStoredEntry(row: Row): StoredEntry {
	const entry: StoredEntry = { id: String(row.id), metadata: String(row.metadata) };
	if (typeof row.content === 'string') entry.content = row.content;
	return entry;
}
