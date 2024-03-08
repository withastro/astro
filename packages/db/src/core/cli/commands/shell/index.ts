import type { AstroConfig } from 'astro';
import { sql } from 'drizzle-orm';
import type { Arguments } from 'yargs-parser';
import {
	createLocalDatabaseClient,
	createRemoteDatabaseClient,
} from '../../../../runtime/db-client.js';
import { DB_PATH } from '../../../consts.js';
import { SHELL_QUERY_MISSING_ERROR } from '../../../errors.js';
import { getManagedAppTokenOrExit } from '../../../tokens.js';
import type { DBConfigInput } from '../../../types.js';
import { getRemoteDatabaseUrl } from '../../../utils.js';

export async function cmd({
	flags,
	astroConfig,
}: {
	dbConfig: DBConfigInput;
	astroConfig: AstroConfig;
	flags: Arguments;
}) {
	const query = flags.query;
	if (!query) {
		console.error(SHELL_QUERY_MISSING_ERROR);
		process.exit(1);
	}
	if (flags.remote) {
		const appToken = await getManagedAppTokenOrExit(flags.token);
		const db = createRemoteDatabaseClient(appToken.token, getRemoteDatabaseUrl());
		const result = await db.run(sql.raw(query));
		await appToken.destroy();
		console.log(result);
	} else {
		const db = createLocalDatabaseClient({ dbUrl: new URL(DB_PATH, astroConfig.root).href });
		const result = await db.run(sql.raw(query));
		console.log(result);
	}
}
