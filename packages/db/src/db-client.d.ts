declare module 'virtual:astro:db-client' {
	export const createClient: typeof import('./core/db-client/libsql-node.ts').createRemoteLibSQLClient;
}
