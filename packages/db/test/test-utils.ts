import { mkdir, unlink } from 'node:fs/promises';
import type { AstroConfig } from 'astro';
import { createClient } from '@libsql/client';
import { cli } from '../dist/core/cli/index.js';
import { resolveDbConfig } from '../dist/core/load-file.js';
import { getCreateIndexQueries, getCreateTableQuery } from '../dist/core/queries.js';
import type { DBTable, ResolvedDBTable } from '../dist/core/types.js';

export {
	loadFixture,
	type DevServer,
	type Fixture,
} from '../../astro/test/test-utils.js';

const isWindows = process.platform === 'win32';

export type RemoteDbServer = { stop: () => Promise<void> };

export async function setupRemoteDb(
	astroConfig: AstroConfig,
	options: { useDbAppTokenFlag?: boolean } = {},
): Promise<RemoteDbServer> {
	const url = isWindows
		? new URL(`./.astro/${Date.now()}.db`, astroConfig.root)
		: new URL(`./${Date.now()}.db`, astroConfig.root);
	const token = 'foo';
	process.env.ASTRO_DB_REMOTE_URL = url.toString();
	if (!options.useDbAppTokenFlag) {
		process.env.ASTRO_DB_APP_TOKEN = token;
	}
	process.env.ASTRO_INTERNAL_TEST_REMOTE = 'true';

	if (isWindows) {
		await mkdir(new URL('.', url), { recursive: true });
	}

	const dbClient = createClient({
		url: url.toString(),
		authToken: token,
	});

	const { dbConfig } = await resolveDbConfig(astroConfig);
	const setupQueries: string[] = [];
	for (const [name, table] of Object.entries(dbConfig?.tables ?? {})) {
		const createQuery = getCreateTableQuery(name, table);
		const indexQueries = getCreateIndexQueries(name, table);
		setupQueries.push(createQuery, ...indexQueries);
	}

	for (const sql of setupQueries) {
		await dbClient.execute({
			sql,
			args: [],
		});
	}

	await cli({
		config: astroConfig,
		flags: {
			_: ['', 'astro', 'db', 'execute', 'db/seed.ts'],
			remote: true,
			...(options.useDbAppTokenFlag ? { dbAppToken: token } : {}),
		},
	});

	return {
		async stop() {
			delete process.env.ASTRO_DB_REMOTE_URL;
			delete process.env.ASTRO_DB_APP_TOKEN;
			delete process.env.ASTRO_INTERNAL_TEST_REMOTE;
			dbClient.close();
			if (!isWindows) {
				await unlink(url);
			}
		},
	};
}

export async function initializeRemoteDb(astroConfig: AstroConfig) {
	await cli({
		config: astroConfig,
		flags: {
			_: ['', 'astro', 'db', 'push'],
			remote: true,
		},
	});
	await cli({
		config: astroConfig,
		flags: {
			_: ['', 'astro', 'db', 'execute', 'db/seed.ts'],
			remote: true,
		},
	});
}

/**
 * Clears the environment variables related to Astro DB.
 */
export function clearEnvironment() {
	const keys = Array.from(Object.keys(process.env));
	for (const key of keys) {
		if (key.startsWith('ASTRO_DB_')) {
			delete process.env[key];
		}
	}
}

export function asResolved(table: DBTable): ResolvedDBTable {
	return table as ResolvedDBTable;
}
