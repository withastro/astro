import type { SQLiteInsertValue } from 'drizzle-orm/sqlite-core';
import type { InferSelectModel } from 'drizzle-orm';
import type { SqliteDB, Table } from '../runtime/index.js';
import { z, type ZodTypeDef } from 'zod';
import { SQL } from 'drizzle-orm';
import { errorMap } from './integration/error-map.js';

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
			primaryKey: z.literal(false).optional(),
			optional: z.boolean().optional(),
			default: z.union([z.number(), z.instanceof(SQL<any>)]).optional(),
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

const numberFieldOptsSchema: z.ZodType<
	z.infer<typeof numberFieldBaseSchema> & {
		// ReferenceableField creates a circular type. Define ZodType to resolve.
		references?: NumberField;
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
			.optional()
			.transform((fn) => fn?.()),
	})
);

const numberFieldSchema = numberFieldOptsSchema.and(
	z.object({
		type: z.literal('number'),
	})
);

const textFieldBaseSchema = baseFieldSchema
	.omit({ optional: true })
	.extend({
		default: z.union([z.string(), z.instanceof(SQL<any>)]).optional(),
		multiline: z.boolean().optional(),
	})
	.and(
		z.union([
			z.object({
				primaryKey: z.literal(false).optional(),
				optional: z.boolean().optional(),
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

const textFieldOptsSchema: z.ZodType<
	z.infer<typeof textFieldBaseSchema> & {
		// ReferenceableField creates a circular type. Define ZodType to resolve.
		references?: TextField;
	},
	ZodTypeDef,
	z.input<typeof textFieldBaseSchema> & {
		references?: () => TextFieldInput;
	}
> = textFieldBaseSchema.and(
	z.object({
		references: z
			.function()
			.returns(z.lazy(() => textFieldSchema))
			.optional()
			.transform((fn) => fn?.()),
	})
);

const textFieldSchema = textFieldOptsSchema.and(
	z.object({
		type: z.literal('text'),
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
export const referenceableFieldSchema = z.union([textFieldBaseSchema, numberFieldSchema]);
export type ReferenceableField = z.input<typeof referenceableFieldSchema>;
const fieldsSchema = z.record(fieldSchema);

export const indexSchema = z.object({
	on: z.string().or(z.array(z.string())),
	unique: z.boolean().optional(),
});

type ForeignKeysInput = {
	fields: MaybeArray<string>;
	references: () => MaybeArray<Omit<ReferenceableField, 'references'>>;
};

type ForeignKeysOutput = Omit<ForeignKeysInput, 'references'> & {
	// reference fn called in `transform`. Ensures output is JSON serializable.
	references: MaybeArray<Omit<ReferenceableField, 'references'>>;
};

const foreignKeysSchema: z.ZodType<ForeignKeysOutput, ZodTypeDef, ForeignKeysInput> = z.object({
	fields: z.string().or(z.array(z.string())),
	references: z
		.function()
		.returns(z.lazy(() => referenceableFieldSchema.or(z.array(referenceableFieldSchema))))
		.transform((fn) => fn()),
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
export const collectionsSchema = z.preprocess((rawCollections) => {
	// Preprocess collections to append collection and field names to fields.
	// Used to track collection info for references.

	// Use minimum parsing to ensure collection has a `fields` record.
	const collections = z
		.record(
			z.object({
				fields: z.record(z.any()),
			})
		)
		.parse(rawCollections, { errorMap });
	for (const [collectionName, collection] of Object.entries(collections)) {
		for (const [fieldName, field] of Object.entries(collection.fields)) {
			field.name = fieldName;
			field.collection = collectionName;
		}
	}
	return rawCollections;
}, z.record(collectionSchema));

export type BooleanField = z.infer<typeof booleanFieldSchema>;
export type NumberField = z.infer<typeof numberFieldSchema>;
export type NumberFieldInput = z.input<typeof numberFieldSchema>;
export type TextField = z.infer<typeof textFieldSchema>;
export type TextFieldInput = z.input<typeof textFieldSchema>;
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
export type DBFieldInput =
	| DateFieldInput
	| BooleanField
	| NumberFieldInput
	| TextFieldInput
	| JsonField;
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
	const meta: { table: Table<string, TFields> } = { table: null! };
	/**
	 * We need to attach the Drizzle `table` at runtime using `_setMeta`.
	 * These cannot be determined from `defineCollection()`,
	 * since we don't know the collection name until the `db` config is resolved.
	 */
	const _setMeta = (values: { table: Table<string, TFields> }) => {
		Object.assign(meta, values);
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
// We cannot use `Omit<NumberField | TextField, 'type'>`,
// since Omit collapses our union type on primary key.
type NumberFieldOpts = z.input<typeof numberFieldOptsSchema>;
type TextFieldOpts = z.input<typeof textFieldOptsSchema>;

export const field = {
	number: <T extends NumberFieldOpts>(opts: T = {} as T) => {
		return { type: 'number', ...opts } satisfies T & { type: 'number' };
	},
	boolean: <T extends FieldOpts<BooleanField>>(opts: T = {} as T) => {
		return { type: 'boolean', ...opts } satisfies T & { type: 'boolean' };
	},
	text: <T extends TextFieldOpts>(opts: T = {} as T) => {
		return { type: 'text', ...opts } satisfies T & { type: 'text' };
	},
	date<T extends FieldOpts<DateFieldInput>>(opts: T) {
		return { type: 'date', ...opts } satisfies T & { type: 'date' };
	},
	json<T extends FieldOpts<JsonField>>(opts: T) {
		return { type: 'json', ...opts } satisfies T & { type: 'json' };
	},
};
