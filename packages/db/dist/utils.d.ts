export { defineDbIntegration } from './core/utils.js';
import type { ColumnsConfig, TableConfig } from './core/types.js';
import { type Table } from './runtime/index.js';
export declare function asDrizzleTable<
	TableName extends string = string,
	TColumns extends ColumnsConfig = ColumnsConfig,
>(name: TableName, tableConfig: TableConfig<TColumns>): Table<TableName, TColumns>;
