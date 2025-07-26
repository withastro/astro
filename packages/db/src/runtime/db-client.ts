import { createClient, type Config as LibSQLConfig } from '@libsql/client';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';

const isWebContainer = !!process.versions?.webcontainer;

type LocalDbClientOptions = {
	dbUrl: string;
};

export function createLocalDatabaseClient(options: LocalDbClientOptions): LibSQLDatabase {
	const url = isWebContainer ? 'file:content.db' : options.dbUrl;
	const client = createClient({ url });
	const db = drizzleLibsql(client);
	return db;
}

type RemoteDbClientOptions = {
	token: string;
	url: string | URL;
};

export function createRemoteDatabaseClient(options: RemoteDbClientOptions) {
	const url = new URL(options.url);

	return createRemoteLibSQLClient(options.token, url, options.url.toString());
}

// this function parses the options from a `Record<string, string>`
// provided from the object conversion of the searchParams and properly
// verifies that the Config object is providing the correct types.
// without this, there is runtime errors due to incorrect values
export function parseOpts(config: Record<string, string>): Partial<LibSQLConfig> {
	return {
		...config,
		...(config.syncInterval ? { syncInterval: parseInt(config.syncInterval) } : {}),
		...('readYourWrites' in config ? { readYourWrites: config.readYourWrites !== 'false' } : {}),
		...('offline' in config ? { offline: config.offline !== 'false' } : {}),
		...('tls' in config ? { tls: config.tls !== 'false' } : {}),
		...(config.concurrency ? { concurrency: parseInt(config.concurrency) } : {}),
	};
}

function createRemoteLibSQLClient(authToken: string, dbURL: URL, rawUrl: string) {
	const options: Record<string, string> = Object.fromEntries(dbURL.searchParams.entries());
	dbURL.search = '';

	let url = dbURL.toString();
	if (dbURL.protocol === 'memory:') {
		// libSQL expects a special string in place of a URL
		// for in-memory DBs.
		url = ':memory:';
	} else if (
		dbURL.protocol === 'file:' &&
		dbURL.pathname.startsWith('/') &&
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
		url = 'file:' + dbURL.pathname.substring(1);
	}

	const client = createClient({ ...parseOpts(options), url, authToken });
	return drizzleLibsql(client);
}
