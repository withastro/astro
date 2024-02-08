import type { AstroConfig } from 'astro';
import { sql } from 'drizzle-orm';
import type { Arguments } from 'yargs-parser';
import { createRemoteDatabaseClient } from '../../../../runtime/db-client.js';
import { getManagedAppTokenOrExit } from '../../../tokens.js';
import { getRemoteDatabaseUrl } from '../../../utils.js';

export async function cmd({ flags }: { config: AstroConfig; flags: Arguments }) {
	const query = flags.query;
	const appToken = await getManagedAppTokenOrExit(flags.token);
	const db = createRemoteDatabaseClient(appToken.token, getRemoteDatabaseUrl());
	// Temporary: create the migration table just in case it doesn't exist
	const result = await db.run(sql.raw(query));
	await appToken.destroy();
	console.log(result);
}
