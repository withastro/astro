type RemoteDbClientOptions = {
	token: string;
	url: string;
};
export declare function createClient(
	opts: RemoteDbClientOptions,
): import('drizzle-orm/libsql').LibSQLDatabase<Record<string, never>> & {
	$client: import('@libsql/client').Client;
};
export {};
