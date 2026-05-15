import { defineDbIntegration } from './core/utils.js';
import { tableSchema } from './core/schemas.js';
import { asDrizzleTable as internal_asDrizzleTable } from './runtime/index.js';
function asDrizzleTable(name, tableConfig) {
	return internal_asDrizzleTable(name, tableSchema.parse(tableConfig));
}
export { asDrizzleTable, defineDbIntegration };
