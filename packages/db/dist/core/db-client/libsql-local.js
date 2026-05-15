import { createClient as createLibsqlClient } from '@libsql/client';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
const isWebContainer = !!process.versions?.webcontainer;
function createClient(options) {
	const url = isWebContainer ? 'file:content.db' : options.url;
	const client = createLibsqlClient({ url });
	const db = drizzleLibsql(client);
	return db;
}
export { createClient };
