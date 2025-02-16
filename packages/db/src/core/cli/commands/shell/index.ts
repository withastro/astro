import type { AstroConfig } from 'astro';
import { sql } from 'drizzle-orm';
import type { Arguments } from 'yargs-parser';
import { SHELL_QUERY_MISSING_ERROR } from '../../../errors.js';
import type { DBConfig } from '../../../types.js';
import type { DatabaseBackend } from '../../../backend/types.js';

export async function cmd({
	flags,
	backend,
}: {
	dbConfig: DBConfig;
	backend: DatabaseBackend<any>;
	astroConfig: AstroConfig;
	flags: Arguments;
}) {
	const query = flags.query;
	if (!query) {
		console.error(SHELL_QUERY_MISSING_ERROR);
		process.exit(1);
	}

	const result = await backend.executeSql(
		flags.remote ? 'remote' : 'local',
		sql.raw(query),
	);
	console.log(result)
}
