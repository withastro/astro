import type { ColumnDataType, ColumnBaseConfig } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTableWithColumns, TableConfig } from 'drizzle-orm/sqlite-core';
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
});

const textFieldSchema = baseFieldSchema.extend({
	type: z.literal('text'),
	multiline: z.boolean().optional(),
	default: z.string().optional(),
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

export const collectionSchema = z.object({
	fields: fieldsSchema,
	data: z.function().returns(fieldsSchema).optional(),
});

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
export type DBCollection<TFields extends DBFields = DBFields> = {
	fields: TFields;
	// TODO: better `insert` types
	data?: () => MaybePromise<Array<Record<keyof TFields, any>>>;
};
export type DBCollections = Record<string, DBCollection>;

export type AstroTable<T extends Pick<TableConfig, 'name' | 'columns'>> = SQLiteTableWithColumns<
	T & {
		schema: undefined;
		dialect: 'sqlite';
	}
>;

type GeneratedConfig<T extends ColumnDataType> = Pick<
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
