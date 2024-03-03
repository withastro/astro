import { SQLiteAsyncDialect, type SQLiteInsertValue } from 'drizzle-orm/sqlite-core';
import type { InferSelectModel } from 'drizzle-orm';
import { collectionToTable, type SqliteDB, type Table } from '../runtime/index.js';
import { z, type ZodTypeDef } from 'zod';
import { SQL } from 'drizzle-orm';
import { errorMap } from './integration/error-map.js';
import { SERIALIZED_SQL_KEY, type SerializedSQL } from '../runtime/types.js';

export type MaybePromise<T> = T | Promise<T>;
export type MaybeArray<T> = T | T[];

// Transform to serializable object for migration files
const sqlite = new SQLiteAsyncDialect();

const sqlSchema = z.instanceof(SQL<any>).transform(
	(sqlObj): SerializedSQL => ({
		[SERIALIZED_SQL_KEY]: true,
		sql: sqlite.sqlToQuery(sqlObj).sql,
	})
);

const baseColumnSchema = z.object({
	label: z.string().optional(),
	optional: z.boolean().optional().default(false),
	unique: z.boolean().optional().default(false),

	// Defined when `defineReadableTable()` is called
	name: z.string().optional(),
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
			default: z.literal(undefined).optional(),
		}),
	])
);

const numberColumnOptsSchema: z.ZodType<
	z.infer<typeof numberColumnBaseSchema> & {
		// ReferenceableColumn creates a circular type. Define ZodType to resolve.
		references?: NumberColumn;
	},
	ZodTypeDef,
	z.input<typeof numberColumnBaseSchema> & {
		references?: () => z.input<typeof numberColumnSchema>;
	}
> = numberColumnBaseSchema.and(
	z.object({
		references: z
			.function()
			.returns(z.lazy(() => numberColumnSchema))
			.optional()
			.transform((fn) => fn?.()),
	})
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
				// lead to duplicate URLs per record in Astro Studio.
				// disable `optional` for primary keys.
				primaryKey: z.literal(true),
				optional: z.literal(false).optional(),
			}),
		])
	);

const textColumnOptsSchema: z.ZodType<
	z.infer<typeof textColumnBaseSchema> & {
		// ReferenceableColumn creates a circular type. Define ZodType to resolve.
		references?: TextColumn;
	},
	ZodTypeDef,
	z.input<typeof textColumnBaseSchema> & {
		references?: () => z.input<typeof textColumnSchema>;
	}
> = textColumnBaseSchema.and(
	z.object({
		references: z
			.function()
			.returns(z.lazy(() => textColumnSchema))
			.optional()
			.transform((fn) => fn?.()),
	})
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

export const columnSchema = z.union([
	booleanColumnSchema,
	numberColumnSchema,
	textColumnSchema,
	dateColumnSchema,
	jsonColumnSchema,
]);
export const referenceableColumnSchema = z.union([textColumnSchema, numberColumnSchema]);

const columnsSchema = z.record(columnSchema);

export const indexSchema = z.object({
	on: z.string().or(z.array(z.string())),
	unique: z.boolean().optional(),
});

type ForeignKeysInput = {
	columns: MaybeArray<string>;
	references: () => MaybeArray<Omit<z.input<typeof referenceableColumnSchema>, 'references'>>;
};

type ForeignKeysOutput = Omit<ForeignKeysInput, 'references'> & {
	// reference fn called in `transform`. Ensures output is JSON serializable.
	references: MaybeArray<Omit<z.output<typeof referenceableColumnSchema>, 'references'>>;
};

const foreignKeysSchema: z.ZodType<ForeignKeysOutput, ZodTypeDef, ForeignKeysInput> = z.object({
	columns: z.string().or(z.array(z.string())),
	references: z
		.function()
		.returns(z.lazy(() => referenceableColumnSchema.or(z.array(referenceableColumnSchema))))
		.transform((fn) => fn()),
});

export type Indexes = Record<string, z.infer<typeof indexSchema>>;

const baseCollectionSchema = z.object({
	columns: columnsSchema,
	indexes: z.record(indexSchema).optional(),
	foreignKeys: z.array(foreignKeysSchema).optional(),
});

export const readableCollectionSchema = baseCollectionSchema.extend({
	writable: z.literal(false),
});

export const writableCollectionSchema = baseCollectionSchema.extend({
	writable: z.literal(true),
});

export const collectionSchema = z.union([readableCollectionSchema, writableCollectionSchema]);
export const tablesSchema = z.preprocess((rawCollections) => {
	// Use `z.any()` to avoid breaking object references
	const tables = z.record(z.any()).parse(rawCollections, { errorMap });
	for (const [collectionName, collection] of Object.entries(tables)) {
		// Append `table` object for data seeding.
		// Must append at runtime so table name exists.
		collection.table = collectionToTable(
			collectionName,
			collectionSchema.parse(collection, { errorMap })
		);
		// Append collection and column names to columns.
		// Used to track collection info for references.
		const { columns } = z.object({ columns: z.record(z.any()) }).parse(collection, { errorMap });
		for (const [columnName, column] of Object.entries(columns)) {
			column.schema.name = columnName;
			column.schema.collection = collectionName;
		}
	}
	return rawCollections;
}, z.record(collectionSchema));

export type BooleanColumn = z.infer<typeof booleanColumnSchema>;
export type BooleanColumnInput = z.input<typeof booleanColumnSchema>;
export type NumberColumn = z.infer<typeof numberColumnSchema>;
export type NumberColumnInput = z.input<typeof numberColumnSchema>;
export type TextColumn = z.infer<typeof textColumnSchema>;
export type TextColumnInput = z.input<typeof textColumnSchema>;
export type DateColumn = z.infer<typeof dateColumnSchema>;
export type DateColumnInput = z.input<typeof dateColumnSchema>;
export type JsonColumn = z.infer<typeof jsonColumnSchema>;
export type JsonColumnInput = z.input<typeof jsonColumnSchema>;

export type ColumnType =
	| BooleanColumn['type']
	| NumberColumn['type']
	| TextColumn['type']
	| DateColumn['type']
	| JsonColumn['type'];

export type DBColumn = z.infer<typeof columnSchema>;
export type DBColumnInput =
	| DateColumnInput
	| BooleanColumnInput
	| NumberColumnInput
	| TextColumnInput
	| JsonColumnInput;
export type DBColumns = z.infer<typeof columnsSchema>;
export type DBTable = z.infer<typeof readableCollectionSchema | typeof writableCollectionSchema>;
export type DBTables = Record<string, DBTable>;
export type DBSnapshot = {
	schema: Record<string, DBTable>;
	/**
	 * Snapshot version. Breaking changes to the snapshot format increment this number.
	 * @todo Rename to "version" once closer to release.
	 */
	experimentalVersion: number;
};
export type ReadableDBTable = z.infer<typeof readableCollectionSchema>;
export type WritableDBTable = z.infer<typeof writableCollectionSchema>;

export type DBDataContext = {
	db: SqliteDB;
	seed: <TColumns extends ColumnsConfig>(
		collection: ResolvedCollectionConfig<TColumns>,
		data: MaybeArray<SQLiteInsertValue<Table<string, TColumns>>>
	) => Promise<void>;
	seedReturning: <
		TColumns extends ColumnsConfig,
		TData extends MaybeArray<SQLiteInsertValue<Table<string, TColumns>>>,
	>(
		collection: ResolvedCollectionConfig<TColumns>,
		data: TData
	) => Promise<
		TData extends Array<SQLiteInsertValue<Table<string, TColumns>>>
			? InferSelectModel<Table<string, TColumns>>[]
			: InferSelectModel<Table<string, TColumns>>
	>;
	mode: 'dev' | 'build';
};

export function defineData(fn: (ctx: DBDataContext) => MaybePromise<void>) {
	return fn;
}

const dbDataFn = z.function().returns(z.union([z.void(), z.promise(z.void())]));

export const dbConfigSchema = z.object({
	studio: z.boolean().optional(),
	tables: tablesSchema.optional(),
	data: z.union([dbDataFn, z.array(dbDataFn)]).optional(),
	unsafeWritable: z.boolean().optional().default(false),
});

type DataFunction = (params: DBDataContext) => MaybePromise<void>;

export type DBUserConfig = Omit<z.input<typeof dbConfigSchema>, 'data'> & {
	data: DataFunction | DataFunction[];
};

export const astroConfigWithDbSchema = z.object({
	db: dbConfigSchema.optional(),
});

export type ColumnsConfig = z.input<typeof collectionSchema>['columns'];

interface CollectionConfig<TColumns extends ColumnsConfig = ColumnsConfig>
	// use `extends` to ensure types line up with zod,
	// only adding generics for type completions.
	extends Pick<z.input<typeof collectionSchema>, 'columns' | 'indexes' | 'foreignKeys'> {
	columns: TColumns;
	foreignKeys?: Array<{
		columns: MaybeArray<Extract<keyof TColumns, string>>;
		// TODO: runtime error if parent collection doesn't match for all columns. Can't put a generic here...
		references: () => MaybeArray<z.input<typeof referenceableColumnSchema>>;
	}>;
	indexes?: Record<string, IndexConfig<TColumns>>;
}

interface IndexConfig<TColumns extends ColumnsConfig> extends z.input<typeof indexSchema> {
	on: MaybeArray<Extract<keyof TColumns, string>>;
}

export type ResolvedCollectionConfig<
	TColumns extends ColumnsConfig = ColumnsConfig,
	Writable extends boolean = boolean,
> = CollectionConfig<TColumns> & {
	writable: Writable;
	table: Table<string, TColumns>;
};

function baseDefineCollection<TColumns extends ColumnsConfig, TWritable extends boolean>(
	userConfig: CollectionConfig<TColumns>,
	writable: TWritable
): ResolvedCollectionConfig<TColumns, TWritable> {
	return {
		...userConfig,
		writable,
		// set at runtime to get the table name
		table: null!,
	};
}

export function defineReadableTable<TColumns extends ColumnsConfig>(
	userConfig: CollectionConfig<TColumns>
): ResolvedCollectionConfig<TColumns, false> {
	return baseDefineCollection(userConfig, false);
}

export function defineWritableTable<TColumns extends ColumnsConfig>(
	userConfig: CollectionConfig<TColumns>
): ResolvedCollectionConfig<TColumns, true> {
	return baseDefineCollection(userConfig, true);
}

export type AstroConfigWithDB = z.input<typeof astroConfigWithDbSchema>;

// We cannot use `Omit<NumberColumn | TextColumn, 'type'>`,
// since Omit collapses our union type on primary key.
type NumberColumnOpts = z.input<typeof numberColumnOptsSchema>;
type TextColumnOpts = z.input<typeof textColumnOptsSchema>;

function createColumn<S extends string, T extends Record<string, unknown>>(type: S, schema: T) {
	return {
		type,
		/**
		 * @internal
		 */
		schema,
	};
}

export const column = {
	number: <T extends NumberColumnOpts>(opts: T = {} as T) => {
		return createColumn('number', opts) satisfies { type: 'number' };
	},
	boolean: <T extends BooleanColumnInput['schema']>(opts: T = {} as T) => {
		return createColumn('boolean', opts) satisfies { type: 'boolean' };
	},
	text: <T extends TextColumnOpts>(opts: T = {} as T) => {
		return createColumn('text', opts) satisfies { type: 'text' };
	},
	date<T extends DateColumnInput['schema']>(opts: T = {} as T) {
		return createColumn('date', opts) satisfies { type: 'date' };
	},
	json<T extends JsonColumnInput['schema']>(opts: T = {} as T) {
		return createColumn('json', opts) satisfies { type: 'json' };
	},
};
