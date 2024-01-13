import yargs from 'yargs-parser';
import { appTokenError } from '../../../errors.js';
import { getAstroStudioEnv, getRemoteDatabaseUrl, isAppTokenValid } from '../../../utils.js';
import path from 'node:path';
import { createRemoteDbClient } from '../../../utils.js';

// Example:
// $ astro db run --script "./migrations/2023090101.js"

export async function cmd() {
	const args = yargs(process.argv.slice(3)) as unknown as {
		script: string;
	};
	const scriptPath = path.resolve(args.script);
	const scriptMod = await import(scriptPath);

	const remoteDbUrl = getRemoteDatabaseUrl();
	const appToken = getAstroStudioEnv().ASTRO_STUDIO_APP_TOKEN;
	if (!appToken || !(await isAppTokenValid({ remoteDbUrl, appToken }))) {
		// eslint-disable-next-line no-console
		console.error(appTokenError);
		process.exit(1);
	}

	const db = createRemoteDbClient(appToken);
	if (scriptMod.run) {
		await scriptMod.run({db});
	}
}
