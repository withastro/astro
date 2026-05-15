import { createClient as createLibsqlClient } from '@libsql/client/web';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql/web';
import { parseLibSQLConfig } from './utils.js';
function createClient(opts) {
	const { token, url: rawUrl } = opts;
	let parsedUrl = new URL(rawUrl);
	const options = Object.fromEntries(parsedUrl.searchParams.entries());
	parsedUrl.search = '';
	let url = parsedUrl.toString();
	const supportedProtocols = ['http:', 'https:', 'libsql:'];
	if (!supportedProtocols.includes(parsedUrl.protocol)) {
		throw new Error(
			`Unsupported protocol "${parsedUrl.protocol}" for libSQL web client. Supported protocols are: ${supportedProtocols.join(', ')}.`,
		);
	}
	const libSQLOptions = parseLibSQLConfig(options);
	const client = createLibsqlClient({ ...libSQLOptions, url, authToken: token });
	return drizzleLibsql(client);
}
export { createClient };
