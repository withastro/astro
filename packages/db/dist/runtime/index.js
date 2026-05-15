import { sql } from 'drizzle-orm';
import { customType, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { isSerializedSQL } from './types.js';
import { hasPrimaryKey, pathToFileURL } from './utils.js';
import { hasPrimaryKey as hasPrimaryKey2 } from './utils.js';
const isISODateString = (str) => /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str);
const dateType = customType({
	dataType() {
		return 'text';
	},
	toDriver(value) {
		return value.toISOString();
	},
	fromDriver(value) {
		if (!isISODateString(value)) {
			value += 'Z';
		}
		return new Date(value);
	},
});
const jsonType = customType({
	dataType() {
		return 'text';
	},
	toDriver(value) {
		return JSON.stringify(value);
	},
	fromDriver(value) {
		return JSON.parse(value);
	},
});
function asDrizzleTable(name, table) {
	const columns = {};
	if (!Object.entries(table.columns).some(([, column]) => hasPrimaryKey(column))) {
		columns['_id'] = integer('_id').primaryKey();
	}
	for (const [columnName, column] of Object.entries(table.columns)) {
		columns[columnName] = columnMapper(columnName, column);
	}
	const drizzleTable = sqliteTable(name, columns, (ormTable) => {
		const indexes = [];
		for (const [indexName, indexProps] of Object.entries(table.indexes ?? {})) {
			const onColNames = Array.isArray(indexProps.on) ? indexProps.on : [indexProps.on];
			const onCols = onColNames.map((colName) => ormTable[colName]);
			if (!atLeastOne(onCols)) continue;
			indexes.push(index(indexName).on(...onCols));
		}
		return indexes;
	});
	return drizzleTable;
}
function atLeastOne(arr) {
	return arr.length > 0;
}
function columnMapper(columnName, column) {
	let c;
	switch (column.type) {
		case 'text': {
			c = text(columnName, { enum: column.schema.enum });
			if (column.schema.default !== void 0)
				c = c.default(handleSerializedSQL(column.schema.default));
			if (column.schema.primaryKey === true) c = c.primaryKey();
			break;
		}
		case 'number': {
			c = integer(columnName);
			if (column.schema.default !== void 0)
				c = c.default(handleSerializedSQL(column.schema.default));
			if (column.schema.primaryKey === true) c = c.primaryKey();
			break;
		}
		case 'boolean': {
			c = integer(columnName, { mode: 'boolean' });
			if (column.schema.default !== void 0)
				c = c.default(handleSerializedSQL(column.schema.default));
			break;
		}
		case 'json':
			c = jsonType(columnName);
			if (column.schema.default !== void 0) c = c.default(column.schema.default);
			break;
		case 'date': {
			c = dateType(columnName);
			if (column.schema.default !== void 0) {
				const def = handleSerializedSQL(column.schema.default);
				c = c.default(typeof def === 'string' ? new Date(def) : def);
			}
			break;
		}
	}
	if (!column.schema.optional) c = c.notNull();
	if (column.schema.unique) c = c.unique();
	return c;
}
function handleSerializedSQL(def) {
	if (isSerializedSQL(def)) {
		return sql.raw(def.sql);
	}
	return def;
}
function normalizeDatabaseUrl(envDbUrl, defaultDbUrl) {
	if (envDbUrl) {
		if (envDbUrl.startsWith('file://')) {
			return envDbUrl;
		}
		return new URL(envDbUrl, pathToFileURL(process.cwd()) + '/').toString();
	} else {
		return defaultDbUrl;
	}
}
export { asDrizzleTable, hasPrimaryKey2 as hasPrimaryKey, normalizeDatabaseUrl };
