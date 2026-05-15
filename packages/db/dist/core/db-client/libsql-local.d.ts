import { type LibSQLDatabase } from 'drizzle-orm/libsql';
type LocalDbClientOptions = {
	url: string;
};
export declare function createClient(options: LocalDbClientOptions): LibSQLDatabase;
export {};
