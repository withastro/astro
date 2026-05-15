import { createClient as createLibsqlClient } from '@libsql/client';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { parseLibSQLConfig } from './utils.js';
function createClient(opts) {
	const { token, url: rawUrl } = opts;
	let parsedUrl = new URL(rawUrl);
	const options = Object.fromEntries(parsedUrl.searchParams.entries());
	parsedUrl.search = '';
	let url = parsedUrl.toString();
	if (parsedUrl.protocol === 'memory:') {
		url = ':memory:';
	} else if (
		parsedUrl.protocol === 'file:' &&
		parsedUrl.pathname.startsWith('/') &&
		!rawUrl.startsWith('file:/')
	) {
		url = 'file:' + parsedUrl.pathname.substring(1);
	}
	const libSQLOptions = parseLibSQLConfig(options);
	const client = createLibsqlClient({ ...libSQLOptions, url, authToken: token });
	return drizzleLibsql(client);
}
export { createClient };
