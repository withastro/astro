import type { SQLiteInsertValue } from 'drizzle-orm/sqlite-core';
import type { SqliteDB, Table } from './internal.js';
import type { DBCollection, MaybeArray, collectionSchema } from './types.js';
import {
	type BooleanField,
	type DBFieldInput,
	type DateFieldInput,
	type JsonField,
	type NumberField,
	type TextField,
	collectionsSchema,
	type indexSchema,
	type MaybePromise,
} from './types.js';
import { z } from 'zod';

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
