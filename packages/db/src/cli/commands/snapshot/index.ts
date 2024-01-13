import type { AstroConfig } from 'astro';
import yargs from 'yargs-parser';
import { appTokenError } from '../../../errors.js';
import {
	adminTable,
	createRemoteDbClient,
	getAstroStudioEnv,
	getRemoteDatabaseUrl,
	isAppTokenValid,
} from '../../../utils.js';

async function localSnapshot({ config }: { config: Pick<AstroConfig, 'db'> }) {
	const collections = config.db?.collections ?? {};
	return JSON.stringify(collections);
}

async function productionSnapshot() {
	const remoteDbUrl = getRemoteDatabaseUrl();
	const appToken = getAstroStudioEnv().ASTRO_STUDIO_APP_TOKEN;
	if (!appToken || !(await isAppTokenValid({ remoteDbUrl, appToken }))) {
		// eslint-disable-next-line no-console
		console.error(appTokenError);
		process.exit(1);
	}

	const db = createRemoteDbClient(appToken);
	const adminEntry = await db
		.select({ collections: adminTable.collections })
		.from(adminTable)
		.get();

	if (!adminEntry) {
		// eslint-disable-next-line no-console
		console.error('⚠️ Unexpected error syncing collections.');
		process.exit(1);
	}

	return adminEntry.collections; // already stringified JSON
}

export async function cmd({ config }: { config: Pick<AstroConfig, 'db'> }) {
	const { target } = yargs(process.argv.slice(3)) as unknown as { target: string };
	if (target === 'local') {
		// eslint-disable-next-line no-console
		console.log(await localSnapshot({ config }));
	} else if (target === 'production') {
		// eslint-disable-next-line no-console
		console.log(await productionSnapshot());
	} else {
		// eslint-disable-next-line no-console
		console.error('Invalid target: ' + target);
		process.exit(1);
	}
}
