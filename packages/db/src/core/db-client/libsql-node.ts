import { createClient as createLibsqlClient } from '@libsql/client';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { parseLibSQLConfig } from './utils.js';

type RemoteDbClientOptions = {
	token: string;
	url: string;
};

export function createClient(opts: RemoteDbClientOptions) {
	const { token, url: rawUrl } = opts;

	let parsedUrl = new URL(rawUrl);

	const options: Record<string, string> = Object.fromEntries(parsedUrl.searchParams.entries());
	parsedUrl.search = '';

	let url = parsedUrl.toString();
	if (parsedUrl.protocol === 'memory:') {
		// libSQL expects a special string in place of a URL
		// for in-memory DBs.
		url = ':memory:';
	} else if (
		parsedUrl.protocol === 'file:' &&
		parsedUrl.pathname.startsWith('/') &&
		!rawUrl.startsWith('file:/')
	) {
		// libSQL accepts relative and absolute file URLs
		// for local DBs. This doesn't match the URL specification.
		// Parsing `file:some.db` and `file:/some.db` should yield
		// the same result, but libSQL interprets the former as
		// a relative path, and the latter as an absolute path.
		// This detects when such a conversion happened during parsing
		// and undoes it so that the URL given to libSQL is the
		// same as given by the user.
		url = 'file:' + parsedUrl.pathname.substring(1);
	}

	const libSQLOptions = parseLibSQLConfig(options);

	const client = createLibsqlClient({ ...libSQLOptions, url, authToken: token });
	return drizzleLibsql(client);
}
