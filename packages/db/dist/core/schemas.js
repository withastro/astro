import { SQL } from 'drizzle-orm';
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core';
import * as z from 'zod/v4';
import { SERIALIZED_SQL_KEY } from '../runtime/types.js';
import { errorMap } from './integration/error-map.js';
import { mapObject } from './utils.js';
const sqlite = new SQLiteAsyncDialect();
const sqlSchema = z.instanceof(SQL).transform((sqlObj) => ({
	[SERIALIZED_SQL_KEY]: true,
	sql: sqlite.sqlToQuery(sqlObj).sql,
}));
const baseColumnSchema = z.object({
	label: z.string().optional(),
	optional: z.boolean().optional().default(false),
	unique: z.boolean().optional().default(false),
	deprecated: z.boolean().optional().default(false),
	// Defined when `defineDb()` is called to resolve `references`
	name: z.string().optional(),
	// TODO: Update to `table`. Will need migration file version change
	collection: z.string().optional(),
});
const booleanColumnSchema = z.object({
	type: z.literal('boolean'),
	schema: baseColumnSchema.extend({
		default: z.union([z.boolean(), sqlSchema]).optional(),
	}),
});
const numberColumnBaseSchema = baseColumnSchema.omit({ optional: true }).and(
	z.union([
		z.object({
			primaryKey: z.literal(false).optional().default(false),
			optional: baseColumnSchema.shape.optional,
			default: z.union([z.number(), sqlSchema]).optional(),
		}),
		z.object({
			// `integer primary key` uses ROWID as the default value.
			// `optional` and `default` do not have an effect,
			// so disable these config options for primary keys.
			primaryKey: z.literal(true),
			optional: z.literal(false).optional(),
			default: z.literal(void 0).optional(),
		}),
	]),
);
const numberColumnOptsSchema = numberColumnBaseSchema.and(
	z.object({
		references: z
			.function({ output: z.lazy(() => numberColumnSchema) })
			.optional()
			.transform((fn) => fn?.()),
	}),
);
const numberColumnSchema = z.object({
	type: z.literal('number'),
	schema: numberColumnOptsSchema,
});
const textColumnBaseSchema = baseColumnSchema
	.omit({ optional: true })
	.extend({
		default: z.union([z.string(), sqlSchema]).optional(),
		multiline: z.boolean().optional(),
		enum: z.tuple([z.string()]).rest(z.string()).optional(),
		// At least one value required,
	})
	.and(
		z.union([
			z.object({
				primaryKey: z.literal(false).optional().default(false),
				optional: baseColumnSchema.shape.optional,
			}),
			z.object({
				// text primary key allows NULL values.
				// NULL values bypass unique checks, which could
				// lead to duplicate URLs per record.
				// disable `optional` for primary keys.
				primaryKey: z.literal(true),
				optional: z.literal(false).optional(),
			}),
		]),
	);
const textColumnOptsSchema = textColumnBaseSchema.and(
	z.object({
		references: z
			.function({ output: z.lazy(() => textColumnSchema) })
			.optional()
			.transform((fn) => fn?.()),
	}),
);
const textColumnSchema = z.object({
	type: z.literal('text'),
	schema: textColumnOptsSchema,
});
const dateColumnSchema = z.object({
	type: z.literal('date'),
	schema: baseColumnSchema.extend({
		default: z
			.union([
				sqlSchema,
				// transform to ISO string for serialization
				z.date().transform((d) => d.toISOString()),
			])
			.optional(),
	}),
});
const jsonColumnSchema = z.object({
	type: z.literal('json'),
	schema: baseColumnSchema.extend({
		default: z.unknown().optional(),
	}),
});
const columnSchema = z.discriminatedUnion('type', [
	booleanColumnSchema,
	numberColumnSchema,
	textColumnSchema,
	dateColumnSchema,
	jsonColumnSchema,
]);
const referenceableColumnSchema = z.union([textColumnSchema, numberColumnSchema]);
const columnsSchema = z.record(z.string(), columnSchema);
const foreignKeysSchema = z.object({
	columns: z.string().or(z.array(z.string())),
	references: z
		.function({
			output: z.lazy(() => referenceableColumnSchema.or(z.array(referenceableColumnSchema))),
		})
		.transform((fn) => fn()),
});
const resolvedIndexSchema = z.object({
	on: z.string().or(z.array(z.string())),
	unique: z.boolean().optional(),
});
const legacyIndexesSchema = z.record(z.string(), resolvedIndexSchema);
const indexSchema = z.object({
	on: z.string().or(z.array(z.string())),
	unique: z.boolean().optional(),
	name: z.string().optional(),
});
const indexesSchema = z.array(indexSchema);
const tableSchema = z.object({
	columns: columnsSchema,
	indexes: indexesSchema.or(legacyIndexesSchema).optional(),
	foreignKeys: z.array(foreignKeysSchema).optional(),
	deprecated: z.boolean().optional().default(false),
});
const tablesSchema = z.preprocess(
	(rawTables) => {
		const tables = z.record(z.string(), z.any()).parse(rawTables, { error: errorMap });
		for (const [tableName, table] of Object.entries(tables)) {
			table.getName = () => tableName;
			const { columns } = z
				.object({ columns: z.record(z.string(), z.any()) })
				.parse(table, { error: errorMap });
			for (const [columnName, column] of Object.entries(columns)) {
				column.schema.name = columnName;
				column.schema.collection = tableName;
			}
		}
		return rawTables;
	},
	z.record(z.string(), tableSchema),
);
const dbConfigSchema = z
	.object({
		tables: tablesSchema.optional(),
	})
	.transform(({ tables = {}, ...config }) => {
		return {
			...config,
			tables: mapObject(tables, (tableName, table) => {
				const { indexes = {} } = table;
				if (!Array.isArray(indexes)) {
					return { ...table, indexes };
				}
				const resolvedIndexes = {};
				for (const index of indexes) {
					if (index.name) {
						const { name: name2, ...rest } = index;
						resolvedIndexes[index.name] = rest;
						continue;
					}
					const indexOn = Array.isArray(index.on) ? index.on.sort().join('_') : index.on;
					const name = tableName + '_' + indexOn + '_idx';
					resolvedIndexes[name] = index;
				}
				return {
					...table,
					indexes: resolvedIndexes,
				};
			}),
		};
	});
export {
	booleanColumnSchema,
	columnSchema,
	columnsSchema,
	dateColumnSchema,
	dbConfigSchema,
	indexSchema,
	jsonColumnSchema,
	numberColumnOptsSchema,
	numberColumnSchema,
	referenceableColumnSchema,
	resolvedIndexSchema,
	tableSchema,
	tablesSchema,
	textColumnOptsSchema,
	textColumnSchema,
};
