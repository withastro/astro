import { getManagedAppTokenOrExit } from '@astrojs/studio';
import type { AstroConfig } from 'astro';
import { sql } from 'drizzle-orm';
import {
	createLocalDatabaseClient,
	createRemoteDatabaseClient,
} from '../../../../runtime/db-client.js';
import { normalizeDatabaseUrl } from '../../../../runtime/index.js';
import { DB_PATH } from '../../../consts.js';
import { SHELL_QUERY_MISSING_ERROR } from '../../../errors.js';
import type { DBConfigInput } from '../../../types.js';
import { getAstroEnv, getRemoteDatabaseUrl } from '../../../utils.js';
import type { YargsArguments } from '../../types.js';

export async function cmd({
	flags,
	astroConfig,
}: {
	dbConfig: DBConfigInput;
	astroConfig: AstroConfig;
	flags: YargsArguments;
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
		const { ASTRO_DATABASE_FILE } = getAstroEnv();
		const dbUrl = normalizeDatabaseUrl(
			ASTRO_DATABASE_FILE,
			new URL(DB_PATH, astroConfig.root).href,
		);
		const db = createLocalDatabaseClient({ dbUrl });
		const result = await db.run(sql.raw(query));
		console.log(result);
	}
}
