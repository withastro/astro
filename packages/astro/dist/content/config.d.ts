import type * as zCore from 'zod/v4/core';
import type * as z from 'zod/v4';
import type { LiveLoader, Loader } from './loaders/types.js';
type ImageFunction = () => z.ZodObject<{
	src: zCore.$ZodString;
	width: zCore.$ZodNumber;
	height: zCore.$ZodNumber;
	format: zCore.$ZodUnion<
		[
			zCore.$ZodLiteral<'png'>,
			zCore.$ZodLiteral<'jpg'>,
			zCore.$ZodLiteral<'jpeg'>,
			zCore.$ZodLiteral<'tiff'>,
			zCore.$ZodLiteral<'webp'>,
			zCore.$ZodLiteral<'gif'>,
			zCore.$ZodLiteral<'svg'>,
			zCore.$ZodLiteral<'avif'>,
		]
	>;
}>;
export interface DataEntry {
	id: string;
	data: Record<string, unknown>;
	filePath?: string;
	body?: string;
}
export interface DataStore {
	get: (key: string) => DataEntry;
	entries: () => Array<[id: string, DataEntry]>;
	set: (key: string, data: Record<string, unknown>, body?: string, filePath?: string) => void;
	values: () => Array<DataEntry>;
	keys: () => Array<string>;
	delete: (key: string) => void;
	clear: () => void;
	has: (key: string) => boolean;
}
export interface MetaStore {
	get: (key: string) => string | undefined;
	set: (key: string, value: string) => void;
	delete: (key: string) => void;
	has: (key: string) => boolean;
}
export type BaseSchema = zCore.$ZodType;
export type { ImageFunction };
export type SchemaContext = {
	image: ImageFunction;
};
type LoaderConstraint<
	TData extends {
		id: string;
	},
> =
	| Loader
	| (() =>
			| Array<TData>
			| Promise<Array<TData>>
			| Record<
					string,
					Omit<TData, 'id'> & {
						id?: string;
					}
			  >
			| Promise<
					Record<
						string,
						Omit<TData, 'id'> & {
							id?: string;
						}
					>
			  >);
type ContentLayerConfig<
	S extends BaseSchema,
	TLoader extends LoaderConstraint<{
		id: string;
	}>,
> = {
	type?: 'content_layer';
	schema?: S | ((context: SchemaContext) => S);
	loader: TLoader;
};
type DataCollectionConfig<S extends BaseSchema> = {
	type: 'data';
	schema?: S | ((context: SchemaContext) => S);
};
type ContentCollectionConfig<S extends BaseSchema> = {
	type?: 'content';
	schema?: S | ((context: SchemaContext) => S);
	loader?: never;
};
export type LiveCollectionConfig<
	L extends LiveLoader,
	S extends BaseSchema | undefined = undefined,
> = {
	type?: 'live';
	schema?: S;
	loader: L;
};
export type CollectionConfig<
	S extends BaseSchema,
	TLoader extends LoaderConstraint<{
		id: string;
	}> = LoaderConstraint<{
		id: string;
	}>,
> = ContentCollectionConfig<S> | DataCollectionConfig<S> | ContentLayerConfig<S, TLoader>;
export declare function defineLiveCollection<
	L extends LiveLoader,
	S extends BaseSchema | undefined = undefined,
>(config: LiveCollectionConfig<L, S>): LiveCollectionConfig<L, S>;
export declare function defineCollection<
	S extends BaseSchema,
	TLoader extends LoaderConstraint<{
		id: string;
	}> = LoaderConstraint<{
		id: string;
	}>,
>(config: CollectionConfig<S, TLoader>): CollectionConfig<S, TLoader>;
