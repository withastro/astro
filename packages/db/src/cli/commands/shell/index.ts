import yargs from 'yargs-parser';
import { appTokenError } from '../../../errors.js';
import { getAstroStudioEnv, getRemoteDatabaseUrl, isAppTokenValid } from '../../../utils.js';

// Example:
// $ astro db shell --query "SELECT * FROM users"

export async function cmd() {
	const { query } = yargs(process.argv.slice(3)) as unknown as { query: string };
	const remoteDbUrl = getRemoteDatabaseUrl();
	const appToken = getAstroStudioEnv().ASTRO_STUDIO_APP_TOKEN;
	if (!appToken || !(await isAppTokenValid({ remoteDbUrl, appToken }))) {
		// eslint-disable-next-line no-console
		console.error(appTokenError);
		process.exit(1);
	}

	const url = new URL('/db/query', remoteDbUrl);
	return await fetch(url, {
		method: 'POST',
		headers: new Headers({
			Authorization: `Bearer ${appToken}`,
		}),
		body: JSON.stringify({
			sql: query,
		}),
	});
}
