import type { AstroIntegration } from 'astro';
import { tableSchema } from './core/schemas.js';
import type { AstroDbIntegration, ColumnsConfig, TableConfig } from './core/types.js';
import { type Table, asDrizzleTable as internal_asDrizzleTable } from './runtime/index.js';

export function defineDbIntegration(integration: AstroDbIntegration): AstroIntegration {
	return integration;
}

export function asDrizzleTable<
	TableName extends string = string,
	TColumns extends ColumnsConfig = ColumnsConfig,
>(name: TableName, tableConfig: TableConfig<TColumns>) {
	return internal_asDrizzleTable(name, tableSchema.parse(tableConfig)) as Table<
		TableName,
		TColumns
	>;
}
