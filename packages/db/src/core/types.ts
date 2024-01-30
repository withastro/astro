import type { SQLiteInsertValue } from 'drizzle-orm/sqlite-core';
import type { SqliteDB, Table } from '../runtime/index.js';
import { z } from 'zod';

export type MaybePromise<T> = T | Promise<T>;
export type MaybeArray<T> = T | T[];

const baseFieldSchema = z.object({
	label: z.string().optional(),
	optional: z.boolean().optional(),
	unique: z.boolean().optional(),
});

const booleanFieldSchema = baseFieldSchema.extend({
	type: z.literal('boolean'),
	default: z.boolean().optional(),
});

const numberFieldSchema = baseFieldSchema.extend({
	type: z.literal('number'),
	default: z.number().optional(),
	primaryKey: z.boolean().optional(),
});

const textFieldSchema = baseFieldSchema.extend({
	type: z.literal('text'),
	multiline: z.boolean().optional(),
	default: z.string().optional(),
	primaryKey: z.boolean().optional(),
});

const dateFieldSchema = baseFieldSchema.extend({
	type: z.literal('date'),
	default: z
		.union([
			z.literal('now'),
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
const fieldsSchema = z.record(fieldSchema);

export const indexSchema = z.object({
	on: z.string().or(z.array(z.string())),
	unique: z.boolean().optional(),
});
const indexesSchema = z.record(indexSchema);

export type Indexes = z.infer<typeof indexesSchema>;

const baseCollectionSchema = z.object({
	fields: fieldsSchema,
	indexes: indexesSchema.optional(),
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
export type DBFieldInput = DateFieldInput | BooleanField | NumberField | TextField | JsonField;
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
	seed<TFields extends FieldsConfig>(
		collection: ResolvedCollectionConfig<TFields>,
		data: MaybeArray<
			SQLiteInsertValue<
				Table<
					string,
					/** TODO: true type inference */ Record<
						Extract<keyof TFields, string>,
						FieldsConfig[number]
					>
				>
			>
		>
	): Promise<any> /** TODO: type output */;
	mode: 'dev' | 'build';
};

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

type CollectionMeta<TFields extends FieldsConfig> = {
	// Collection table is set later when running the data() function.
	// Collection config is assigned to an object key,
	// so the collection itself does not know the table name.
	table: Table<string, TFields>;
};

interface CollectionConfig<TFields extends FieldsConfig>
	// use `extends` to ensure types line up with zod,
	// only adding generics for type completions.
	extends Pick<z.input<typeof collectionSchema>, 'fields' | 'indexes'> {
	fields: TFields;
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

export function defineCollection<TFields extends FieldsConfig>(
	userConfig: CollectionConfig<TFields>
): ResolvedCollectionConfig<TFields, false> {
	const meta: CollectionMeta<TFields> = { table: null! };
	function _setMeta(values: CollectionMeta<TFields>) {
		Object.assign(meta, values);
	}
	return {
		...userConfig,
		writable: false,
		get table() {
			return meta.table;
		},
		// @ts-expect-error private field
		_setMeta,
	};
}

export function defineWritableCollection<TFields extends FieldsConfig>(
	userConfig: CollectionConfig<TFields>
): ResolvedCollectionConfig<TFields, true> {
	const meta: CollectionMeta<TFields> = { table: null! };
	function _setMeta(values: CollectionMeta<TFields>) {
		Object.assign(meta, values);
	}
	return {
		...userConfig,
		writable: true,
		get table() {
			return meta.table;
		},
		// @ts-expect-error private field
		_setMeta,
	};
}

export type AstroConfigWithDB = z.infer<typeof astroConfigWithDbSchema>;

type FieldOpts<T extends DBFieldInput> = Omit<T, 'type'>;

const baseDefaults = {
	optional: false,
	unique: false,
	label: undefined,
	default: undefined,
};

export const field = {
	number(opts: FieldOpts<NumberField> = {}): NumberField {
		return { type: 'number', ...baseDefaults, ...opts };
	},
	boolean(opts: FieldOpts<BooleanField> = {}): BooleanField {
		return { type: 'boolean', ...baseDefaults, ...opts };
	},
	text(opts: FieldOpts<TextField> = {}): TextField {
		return { type: 'text', multiline: false, ...baseDefaults, ...opts };
	},
	date(opts: FieldOpts<DateFieldInput> = {}): DateFieldInput {
		return { type: 'date', ...baseDefaults, ...opts };
	},
	json(opts: FieldOpts<JsonField> = {}): JsonField {
		return { type: 'json', ...baseDefaults, ...opts };
	},
};
