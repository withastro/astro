import { type ColumnDataType } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { DBTable } from '../core/types.js';
export type Database = LibSQLDatabase;
export type { Table } from './types.js';
export { hasPrimaryKey } from './utils.js';
export declare function asDrizzleTable(
	name: string,
	table: DBTable,
): import('drizzle-orm/sqlite-core').SQLiteTableWithColumns<{
	name: string;
	schema: undefined;
	columns: {
		[x: string]: import('drizzle-orm/sqlite-core').SQLiteColumn<
			{
				name: string;
				tableName: string;
				dataType: ColumnDataType;
				columnType: string;
				data: unknown;
				driverParam: unknown;
				notNull: false;
				hasDefault: false;
				isPrimaryKey: false;
				isAutoincrement: false;
				hasRuntimeDefault: false;
				enumValues: string[] | undefined;
				baseColumn: never;
				identity: undefined;
				generated: undefined;
			},
			{},
			{}
		>;
	};
	dialect: 'sqlite';
}>;
export declare function normalizeDatabaseUrl(
	envDbUrl: string | undefined,
	defaultDbUrl: string,
): string;
