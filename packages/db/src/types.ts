import type { ColumnDataType, ColumnBaseConfig } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';

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

export const readableCollectionSchema = z.object({
	fields: fieldsSchema,
	set: z.function(),
	_setEnv: z.function(),
	writable: z.literal(false),
});

export const writableCollectionSchema = z.object({
	fields: fieldsSchema,
	set: z.function(),
	_setEnv: z.function(),
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

type GeneratedConfig<T extends ColumnDataType = ColumnDataType> = Pick<
	ColumnBaseConfig<T, string>,
	'name' | 'tableName' | 'notNull' | 'hasDefault'
>;

export type AstroText<T extends GeneratedConfig<'string'>> = SQLiteColumn<
	T & {
		data: string;
		dataType: 'string';
		columnType: 'SQLiteText';
		driverParam: string;
		enumValues: never;
		baseColumn: never;
	}
>;

export type AstroDate<T extends GeneratedConfig<'custom'>> = SQLiteColumn<
	T & {
		data: Date;
		dataType: 'custom';
		columnType: 'SQLiteCustomColumn';
		driverParam: string;
		enumValues: never;
		baseColumn: never;
	}
>;

export type AstroBoolean<T extends GeneratedConfig<'boolean'>> = SQLiteColumn<
	T & {
		data: boolean;
		dataType: 'boolean';
		columnType: 'SQLiteBoolean';
		driverParam: number;
		enumValues: never;
		baseColumn: never;
	}
>;

export type AstroNumber<T extends GeneratedConfig<'number'>> = SQLiteColumn<
	T & {
		data: number;
		dataType: 'number';
		columnType: 'SQLiteInteger';
		driverParam: number;
		enumValues: never;
		baseColumn: never;
	}
>;

export type AstroJson<T extends GeneratedConfig<'custom'>> = SQLiteColumn<
	T & {
		data: unknown;
		dataType: 'custom';
		columnType: 'SQLiteCustomColumn';
		driverParam: string;
		enumValues: never;
		baseColumn: never;
	}
>;

export type AstroId<T extends Pick<GeneratedConfig<'string'>, 'tableName'>> = SQLiteColumn<
	T & {
		name: 'id';
		hasDefault: true;
		notNull: true;
		data: string;
		dataType: 'custom';
		columnType: 'SQLiteCustomColumn';
		driverParam: string;
		enumValues: never;
		baseColumn: never;
	}
>;

export type MaybePromise<T> = T | Promise<T>;
export type MaybeArray<T> = T | T[];

export type Column<T extends DBField['type'], S extends GeneratedConfig> = T extends 'boolean'
	? AstroBoolean<S>
	: T extends 'number'
		? AstroNumber<S>
		: T extends 'text'
			? AstroText<S>
			: T extends 'date'
				? AstroDate<S>
				: T extends 'json'
					? AstroJson<S>
					: never;

export type Table<
	TTableName extends string,
	TFields extends Record<string, Pick<DBField, 'type' | 'default' | 'optional'>>,
> = SQLiteTableWithColumns<{
	name: TTableName;
	schema: undefined;
	dialect: 'sqlite';
	columns: {
		id: AstroId<{ tableName: TTableName }>;
	} & {
		[K in Extract<keyof TFields, string>]: Column<
			TFields[K]['type'],
			{
				tableName: TTableName;
				name: K;
				hasDefault: TFields[K]['default'] extends undefined ? false : true;
				notNull: TFields[K]['optional'] extends true ? false : true;
			}
		>;
	};
}>;
