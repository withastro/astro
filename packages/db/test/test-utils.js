import { createClient } from '@libsql/client';
import { cli } from '../dist/core/cli/index.js';
import { resolveDbConfig } from '../dist/core/load-file.js';
import { getCreateIndexQueries, getCreateTableQuery } from '../dist/core/queries.js';

/**
 * @param {import('astro').AstroConfig} astroConfig
 */
export async function setupRemoteDb(astroConfig) {
	const url = new URL(`./${Date.now()}.db`, astroConfig.outDir);
	const token = 'foo';
	process.env.ASTRO_DB_REMOTE_URL = url.toString();
	process.env.ASTRO_DB_APP_TOKEN = token;
	process.env.ASTRO_INTERNAL_TEST_REMOTE = true;

	const dbClient = createClient({
		url,
		authToken: token,
	});

	const { dbConfig } = await resolveDbConfig(astroConfig);
	const setupQueries = [];
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
			_: [undefined, 'astro', 'db', 'execute', 'db/seed.ts'],
			remote: true,
		},
	});

	return {
		async stop() {
			delete process.env.ASTRO_DB_REMOTE_URL;
			delete process.env.ASTRO_DB_APP_TOKEN;
			delete process.env.ASTRO_INTERNAL_TEST_REMOTE;
			dbClient.close();
		},
	};
}

export async function initializeRemoteDb(astroConfig) {
	await cli({
		config: astroConfig,
		flags: {
			_: [undefined, 'astro', 'db', 'push'],
			remote: true,
		},
	});
	await cli({
		config: astroConfig,
		flags: {
			_: [undefined, 'astro', 'db', 'execute', 'db/seed.ts'],
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
