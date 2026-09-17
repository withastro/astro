import { promises as fs } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { sqlLiteral } from '../runtime/sql.js';
import type { SqliteDriver } from './types.js';

export interface NodeDriverOptions {
	/** Name of the database file copied next to the server bundle. Defaults to `astro-sqlite.db`. */
	fileName?: string;
}

/**
 * Ships the database as a file next to the server bundle and reads it through
 * Node's built-in SQLite. This is the default driver, and the only one needed
 * for static builds, where the data is only ever read while prerendering.
 */
export function node(options: NodeDriverOptions = {}): SqliteDriver {
	const fileName = options.fileName ?? 'astro-sqlite.db';
	return {
		name: 'node',
		runtime: {
			entrypoint: '@astrojs/sqlite/runtime/node',
			options: { path: fileName },
		},
		async push({ config, buildOutput, databasePath, logger }) {
			if (buildOutput === 'static') return;
			const target = new URL(fileName, config.build.server);
			await fs.rm(target, { force: true });
			// `VACUUM INTO` produces a compact, self-contained copy even while the source is in WAL mode.
			const source = new DatabaseSync(databasePath, { readOnly: true });
			try {
				source.exec(`VACUUM INTO ${sqlLiteral(fileURLToPath(target))}`);
			} finally {
				source.close();
			}
			logger.info(`Copied database to ${fileURLToPath(target)}`);
		},
	};
}
