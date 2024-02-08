import type { SQLiteInsertValue } from 'drizzle-orm/sqlite-core';
import type { InferSelectModel } from 'drizzle-orm';
import type { SqliteDB, Table } from '../runtime/index.js';
import { z, type ZodTypeDef } from 'zod';
import { getTableName, SQL } from 'drizzle-orm';

export type MaybePromise<T> = T | Promise<T>;
export type MaybeArray<T> = T | T[];

const baseFieldSchema = z.object({
	label: z.string().optional(),
	optional: z.boolean().optional(),
	unique: z.boolean().optional(),

	// Defined when `defineCollection()` is called
	name: z.string().optional(),
	collection: z.string().optional(),
});

const booleanFieldSchema = baseFieldSchema.extend({
	type: z.literal('boolean'),
	default: z.union([z.boolean(), z.instanceof(SQL<any>)]).optional(),
});

const numberFieldBaseSchema = baseFieldSchema.omit({ optional: true }).and(
	z.union([
		z.object({
			primaryKey: z.literal(false).optional().default(false),
			optional: z.boolean().optional(),
			default: z.union([z.number(), z.instanceof(SQL<any>)]).optional(),
		}),
		z
			.object({
				// `integer primary key` uses ROWID as the default value.
				// `optional` and `default` do not have an effect,
				// so omit these config options for primary keys.
				primaryKey: z.literal(true),
			})
			.transform((val) => ({ ...val, optional: false, default: undefined })),
	])
);

const numberFieldOptsSchema: z.ZodType<
	z.output<typeof numberFieldBaseSchema> & {
		// ReferenceableField creates a circular type. Define ZodType to resolve.
		references?: () => NumberFieldInput;
	},
	ZodTypeDef,
	z.input<typeof numberFieldBaseSchema> & {
		references?: () => NumberFieldInput;
	}
> = numberFieldBaseSchema.and(
	z.object({
		references: z
			.function()
			.returns(z.lazy(() => numberFieldSchema))
			.optional(),
	})
);

export type NumberFieldOpts = z.input<typeof numberFieldOptsSchema>;

const numberFieldSchema = numberFieldOptsSchema.and(
	z.object({
		type: z.literal('number'),
	})
);

const textFieldBaseSchema = baseFieldSchema.extend({
	type: z.literal('text'),
	primaryKey: z.boolean().optional(),
	default: z.union([z.string(), z.instanceof(SQL<any>)]).optional(),
});

const textFieldSchema: z.ZodType<
	z.infer<typeof textFieldBaseSchema> & {
		// ReferenceableField creates a circular type. Define ZodType to resolve.
		references?: () => TextField;
	}
> = textFieldBaseSchema.and(
	z.object({
		references: z
			.function()
			.returns(z.lazy(() => textFieldBaseSchema))
			.optional(),
	})
);

const dateFieldSchema = baseFieldSchema.extend({
	type: z.literal('date'),
	default: z
		.union([
			z.instanceof(SQL<any>),
			// allow date-like defaults in user config,
			// transform to ISO string for D1 storage
			z.coerce.date().transform((d) => d.toISOString()),
		])
		.optional(),
});

const jsonFieldSchema = baseFieldSchema.extend({
	type: z.literal('json'),
	default: z.unknown().optional(),
});

const fieldSchema = z.union([
	booleanFieldSchema,
	numberFieldSchema,
	textFieldSchema,
	dateFieldSchema,
	jsonFieldSchema,
]);
export const referenceableFieldSchema = z.union([textFieldBaseSchema, numberFieldBaseSchema]);
export type ReferenceableField = z.input<typeof referenceableFieldSchema>;
const fieldsSchema = z.record(fieldSchema);

export const indexSchema = z.object({
	on: z.string().or(z.array(z.string())),
	unique: z.boolean().optional(),
});

const foreignKeysSchema: z.ZodType<{
	fields: MaybeArray<string>;
	references: () => MaybeArray<ReferenceableField>;
}> = z.object({
	fields: z.string().or(z.array(z.string())),
	references: z
		.function()
		.returns(z.lazy(() => referenceableFieldSchema.or(z.array(referenceableFieldSchema)))),
});

export type Indexes = Record<string, z.infer<typeof indexSchema>>;

const baseCollectionSchema = z.object({
	fields: fieldsSchema,
	indexes: z.record(indexSchema).optional(),
	foreignKeys: z.array(foreignKeysSchema).optional(),
	table: z.any(),
	_setMeta: z.function().optional(),
});

export const readableCollectionSchema = baseCollectionSchema.extend({
	writable: z.literal(false),
});

export const writableCollectionSchema = baseCollectionSchema.extend({
	writable: z.literal(true),
});

export const collectionSchema = z.union([readableCollectionSchema, writableCollectionSchema]);
export const collectionsSchema = z.record(collectionSchema);

export type BooleanField = z.infer<typeof booleanFieldSchema>;
export type NumberFieldInput = z.input<typeof numberFieldSchema>;
export type NumberField = z.infer<typeof numberFieldSchema>;
export type TextField = z.infer<typeof textFieldSchema>;
export type DateField = z.infer<typeof dateFieldSchema>;
// Type `Date` is the config input, `string` is the output for D1 storage
export type DateFieldInput = z.input<typeof dateFieldSchema>;
export type JsonField = z.infer<typeof jsonFieldSchema>;

export type FieldType =
	| BooleanField['type']
	| NumberField['type']
	| TextField['type']
	| DateField['type']
	| JsonField['type'];

export type DBField = z.infer<typeof fieldSchema>;
export type DBFieldInput = DateFieldInput | BooleanField | NumberFieldInput | TextField | JsonField;
export type DBFields = z.infer<typeof fieldsSchema>;
export type DBCollection = z.infer<
	typeof readableCollectionSchema | typeof writableCollectionSchema
>;
export type DBCollections = Record<string, DBCollection>;
export type DBSnapshot = {
	schema: Record<string, DBCollection>;
	/**
	 * Snapshot version. Breaking changes to the snapshot format increment this number.
	 * @todo Rename to "version" once closer to release.
	 */
	experimentalVersion: number;
};
export type ReadableDBCollection = z.infer<typeof readableCollectionSchema>;
export type WritableDBCollection = z.infer<typeof writableCollectionSchema>;

export type DBDataContext = {
	db: SqliteDB;
	seed: <
		TFields extends FieldsConfig,
		TData extends MaybeArray<SQLiteInsertValue<Table<string, TFields>>>,
	>(
		collection: ResolvedCollectionConfig<TFields>,
		data: TData
	) => Promise<
		TData extends Array<SQLiteInsertValue<Table<string, TFields>>>
			? InferSelectModel<Table<string, TFields>>[]
			: InferSelectModel<Table<string, TFields>>
	>;
	mode: 'dev' | 'build';
};

export function defineData(fn: (ctx: DBDataContext) => MaybePromise<void>) {
	return fn;
}

export const dbConfigSchema = z.object({
	studio: z.boolean().optional(),
	collections: collectionsSchema.optional(),
	data: z
		.function()
		.returns(z.union([z.void(), z.promise(z.void())]))
		.optional(),
});

export type DBUserConfig = Omit<z.input<typeof dbConfigSchema>, 'data'> & {
	data(params: DBDataContext): MaybePromise<void>;
};

export const astroConfigWithDbSchema = z.object({
	db: dbConfigSchema.optional(),
});

export type FieldsConfig = z.input<typeof collectionSchema>['fields'];

interface CollectionConfig<TFields extends FieldsConfig = FieldsConfig>
	// use `extends` to ensure types line up with zod,
	// only adding generics for type completions.
	extends Pick<z.input<typeof collectionSchema>, 'fields' | 'indexes' | 'foreignKeys'> {
	fields: TFields;
	foreignKeys?: Array<{
		fields: MaybeArray<Extract<keyof TFields, string>>;
		// TODO: runtime error if parent collection doesn't match for all fields. Can't put a generic here...
		references: () => MaybeArray<ReferenceableField>;
	}>;
	indexes?: Record<string, IndexConfig<TFields>>;
}

interface IndexConfig<TFields extends FieldsConfig> extends z.input<typeof indexSchema> {
	on: MaybeArray<Extract<keyof TFields, string>>;
}

export type ResolvedCollectionConfig<
	TFields extends FieldsConfig = FieldsConfig,
	Writable extends boolean = boolean,
> = CollectionConfig<TFields> & {
	writable: Writable;
	table: Table<string, TFields>;
};

function baseDefineCollection<TFields extends FieldsConfig, TWritable extends boolean>(
	userConfig: CollectionConfig<TFields>,
	writable: TWritable
): ResolvedCollectionConfig<TFields, TWritable> {
	for (const fieldName in userConfig.fields) {
		const field = userConfig.fields[fieldName];
		// Store field name within the field itself to track references
		field.name = fieldName;
	}
	const meta: { table: Table<string, TFields> } = { table: null! };
	/**
	 * We need to attach the Drizzle `table` at runtime using `_setMeta`.
	 * These cannot be determined from `defineCollection()`,
	 * since we don't know the collection name until the `db` config is resolved.
	 */
	const _setMeta = (values: { table: Table<string, TFields> }) => {
		Object.assign(meta, values);

		const tableName = getTableName(meta.table);
		for (const fieldName in userConfig.fields) {
			const field = userConfig.fields[fieldName];
			field.collection = tableName;
		}
	};

	return {
		...userConfig,
		get table() {
			return meta.table;
		},
		writable,
		// @ts-expect-error private setter
		_setMeta,
	};
}

export function defineCollection<TFields extends FieldsConfig>(
	userConfig: CollectionConfig<TFields>
): ResolvedCollectionConfig<TFields, false> {
	return baseDefineCollection(userConfig, false);
}

export function defineWritableCollection<TFields extends FieldsConfig>(
	userConfig: CollectionConfig<TFields>
): ResolvedCollectionConfig<TFields, true> {
	return baseDefineCollection(userConfig, true);
}

export type AstroConfigWithDB = z.infer<typeof astroConfigWithDbSchema>;

type FieldOpts<T extends DBFieldInput> = Omit<T, 'type'>;

export const field = {
	number: <T extends NumberFieldOpts>(opts: T = {} as T) => {
		return { type: 'number', ...opts } satisfies NumberFieldInput;
	},
	boolean: <T extends FieldOpts<BooleanField>>(opts: T = {} as T) => {
		return { type: 'boolean', ...opts } satisfies BooleanField;
	},
	text: <T extends FieldOpts<TextField>>(opts: T = {} as T) => {
		return { type: 'text', ...opts } satisfies TextField;
	},
	date<T extends FieldOpts<DateFieldInput>>(opts: T) {
		return { type: 'date', ...opts } satisfies DateFieldInput;
	},
	json<T extends FieldOpts<JsonField>>(opts: T) {
		return { type: 'json', ...opts } satisfies JsonField;
	},
};
