import { type Config as LibSQLConfig, createClient } from '@libsql/client';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';

const isWebContainer = !!process.versions?.webcontainer;

function applyTransactionNotSupported(db: SqliteRemoteDatabase) {
	Object.assign(db, {
		transaction() {
			throw new Error(
				'`db.transaction()` is not currently supported. We recommend `db.batch()` for automatic error rollbacks across multiple queries.',
			);
		},
	});
}

type LocalDbClientOptions = {
	dbUrl: string;
	enableTransactions: boolean;
};

export function createLocalDatabaseClient(options: LocalDbClientOptions): LibSQLDatabase {
	const url = isWebContainer ? 'file:content.db' : options.dbUrl;
	const client = createClient({ url });
	const db = drizzleLibsql(client);

	if (!options.enableTransactions) {
		applyTransactionNotSupported(db);
	}
	return db;
}

type RemoteDbClientOptions = {
	dbType: 'libsql';
	appToken: string;
	remoteUrl: string | URL;
};

export function createRemoteDatabaseClient(options: RemoteDbClientOptions) {
	const remoteUrl = new URL(options.remoteUrl);

	return createRemoteLibSQLClient(options.appToken, remoteUrl, options.remoteUrl.toString());
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

function createRemoteLibSQLClient(appToken: string, remoteDbURL: URL, rawUrl: string) {
	const options: Record<string, string> = Object.fromEntries(remoteDbURL.searchParams.entries());
	remoteDbURL.search = '';

	let url = remoteDbURL.toString();
	if (remoteDbURL.protocol === 'memory:') {
		// libSQL expects a special string in place of a URL
		// for in-memory DBs.
		url = ':memory:';
	} else if (
		remoteDbURL.protocol === 'file:' &&
		remoteDbURL.pathname.startsWith('/') &&
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
		url = 'file:' + remoteDbURL.pathname.substring(1);
	}

	const client = createClient({ ...parseOpts(options), url, authToken: appToken });
	return drizzleLibsql(client);
}
