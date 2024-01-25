import {
	type BooleanField,
	type DBFieldInput,
	type DateFieldInput,
	type JsonField,
	type NumberField,
	type TextField,
	type collectionSchema,
	collectionsSchema,
	type MaybePromise,
	type Table,
} from './types.js';
import { z } from 'zod';
import { type SqliteDB } from './internal.js';
import type { SQLiteInsertValue } from 'drizzle-orm/sqlite-core';

export const dbConfigSchema = z.object({
	studio: z.boolean().optional(),
	collections: collectionsSchema.optional(),
	// TODO: strict types
	data: z
		.function()
		.args()
		.returns(z.union([z.void(), z.promise(z.void())]))
		.optional(),
});

export type DBUserConfig = Omit<z.input<typeof dbConfigSchema>, 'data' | 'collections'> & {
	collections: Record<
		string,
		ResolvedCollectionConfig<z.input<typeof collectionSchema>['fields'], boolean>
	>;
	data(): MaybePromise<void>;
};

export const astroConfigWithDbSchema = z.object({
	db: dbConfigSchema.optional(),
});

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

type ResolvedCollectionConfig<
	TFields extends z.input<typeof collectionSchema>['fields'],
	Writable extends boolean,
> = CollectionConfig<TFields, Writable> & {
	writable: Writable;
	set(data: SQLiteInsertValue<Table<string, TFields>>): Promise<any> /** TODO: type output */;
};
type SetData<TFields extends z.input<typeof collectionSchema>['fields']> = SQLiteInsertValue<
	Table<string, TFields>
>;

export function defineCollection<TFields extends z.input<typeof collectionSchema>['fields']>(
	userConfig: CollectionConfig<TFields, false>
): ResolvedCollectionConfig<TFields, false> {
	let db: SqliteDB | undefined;
	let table: Table<string, TFields> | undefined;
	function _setEnv(env: { db: SqliteDB; table: Table<string, TFields> }) {
		db = env.db;
		table = env.table;
	}
	return {
		...userConfig,
		writable: false,
		// @ts-expect-error keep private
		_setEnv,
		set: async (values: SetData<TFields>) => {
			if (!db || !table) {
				throw new Error('Collection `.set()` can only be called during `data()` seeding.');
			}

			const result = Array.isArray(values)
				? await db.insert(table).values(values).returning()
				: await db.insert(table).values(values).returning().get();
			return result;
		},
	};
}

export function defineWritableCollection<
	TFields extends z.input<typeof collectionSchema>['fields'],
>(userConfig: CollectionConfig<TFields, true>): ResolvedCollectionConfig<TFields, true> {
	return {
		...userConfig,
		writable: true,
		set: () => {
			throw new Error('TODO: implement for writable');
		},
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
