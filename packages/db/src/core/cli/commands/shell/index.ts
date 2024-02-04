import type { AstroConfig } from 'astro';
import { sql } from 'drizzle-orm';
import type { Arguments } from 'yargs-parser';
import { APP_TOKEN_ERROR } from '../../../errors.js';
import { getAstroStudioEnv, getRemoteDatabaseUrl } from '../../../utils.js';
import { createRemoteDatabaseClient } from '../../../../runtime/db-client.js';

export async function cmd({ flags }: { config: AstroConfig; flags: Arguments }) {
	const query = flags.query;
	const appToken = flags.token ?? getAstroStudioEnv().ASTRO_STUDIO_APP_TOKEN;
	if (!appToken) {
		console.error(APP_TOKEN_ERROR);
		process.exit(1);
	}

	const db = createRemoteDatabaseClient(appToken, getRemoteDatabaseUrl());
	// Temporary: create the migration table just in case it doesn't exist
	const result = await db.run(sql.raw(query));
	console.log(result);
}
