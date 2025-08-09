import { createClient as createLibsqlClient } from '@libsql/client';
import { drizzle as drizzleLibsql, type LibSQLDatabase } from 'drizzle-orm/libsql';

const isWebContainer = !!process.versions?.webcontainer;

type LocalDbClientOptions = {
	url: string;
};

export function createClient(options: LocalDbClientOptions): LibSQLDatabase {
	const url = isWebContainer ? 'file:content.db' : options.url;
	const client = createLibsqlClient({ url });
	const db = drizzleLibsql(client);
	return db;
}
