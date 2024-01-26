import type { Table } from './internal.js';
import type { collectionSchema } from './types.js';
import {
	type BooleanField,
	type DBFieldInput,
	type DateFieldInput,
	type JsonField,
	type NumberField,
	type TextField,
	collectionsSchema,
	type MaybePromise,
	type DbDataContext,
} from './types.js';
import { z } from 'zod';

export const dbConfigSchema = z.object({
	studio: z.boolean().optional(),
	collections: collectionsSchema.optional(),
	// TODO: strict types
	data: z
		.function()
		.returns(z.union([z.void(), z.promise(z.void())]))
		.optional(),
});

export type DBUserConfig = Omit<z.input<typeof dbConfigSchema>, 'data'> & {
	data(params: DbDataContext): MaybePromise<void>;
};

export const astroConfigWithDbSchema = z.object({
	db: dbConfigSchema.optional(),
});

type CollectionMeta<TFields extends z.input<typeof collectionSchema>['fields']> = {
	// Collection table is set later when running the data() function.
	// Collection config is assigned to an object key,
	// so the collection itself does not know the table name.
	table: Table<string, TFields>;
};

type CollectionConfig<
	TFields extends z.input<typeof collectionSchema>['fields'],
	Writable extends boolean,
> = Writable extends true
	? {
			fields: TFields;
			// TODO: type inference based on field type. Just `any` for now.
			seed?: Writable extends false
				? never
				: () => MaybePromise<Array<Record<keyof TFields, any> & { id?: string }>>;
		}
	: {
			fields: TFields;
			// TODO: type inference based on field type. Just `any` for now.
			data?: Writable extends true
				? never
				: () => MaybePromise<Array<Record<keyof TFields, any> & { id?: string }>>;
		};

export type ResolvedCollectionConfig<
	TFields extends z.input<typeof collectionSchema>['fields'],
	Writable extends boolean = boolean,
> = CollectionConfig<TFields, Writable> & {
	writable: Writable;
	table: Table<string, TFields>;
};

export function defineCollection<TFields extends z.input<typeof collectionSchema>['fields']>(
	userConfig: CollectionConfig<TFields, false>
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

export function defineWritableCollection<
	TFields extends z.input<typeof collectionSchema>['fields'],
>(userConfig: CollectionConfig<TFields, true>): ResolvedCollectionConfig<TFields, true> {
	const meta: CollectionMeta<TFields> = {
		table: null!,
	};
	function _setMeta(values: CollectionMeta<TFields>) {
		Object.assign(meta, values);
	}
	return {
		...userConfig,
		writable: true,
		table: meta.table,
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
