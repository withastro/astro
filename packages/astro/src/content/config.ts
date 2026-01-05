import type * as zCore from 'zod/v4/core';
import type * as z from 'zod/v4';
import { AstroError, AstroErrorData, AstroUserError } from '../core/errors/index.js';
import { CONTENT_LAYER_TYPE, LIVE_CONTENT_TYPE } from './consts.js';
import type { LiveLoader, Loader } from './loaders/types.js';

function getImporterFilename() {
	// Find the first line in the stack trace that doesn't include 'defineCollection' or 'getImporterFilename'
	const stackLine = new Error().stack
		?.split('\n')
		.find(
			(line) =>
				!line.includes('defineCollection') &&
				!line.includes('defineLiveCollection') &&
				!line.includes('getImporterFilename') &&
				!line.startsWith('Error'),
		);
	if (!stackLine) {
		return undefined;
	}
	// Extract the relative path from the stack line
	const match = /\/((?:src|chunks)\/.*?):\d+:\d+/.exec(stackLine);

	return match?.[1] ?? undefined;
}

// This needs to be in sync with ImageMetadata
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

export type SchemaContext = { image: ImageFunction };

type LoaderConstraint<TData extends { id: string }> =
	| Loader
	| (() =>
			| Array<TData>
			| Promise<Array<TData>>
			| Record<string, Omit<TData, 'id'> & { id?: string }>
			| Promise<Record<string, Omit<TData, 'id'> & { id?: string }>>);

type ContentLayerConfig<S extends BaseSchema, TLoader extends LoaderConstraint<{ id: string }>> = {
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
	TLoader extends LoaderConstraint<{ id: string }> = LoaderConstraint<{ id: string }>,
> = ContentCollectionConfig<S> | DataCollectionConfig<S> | ContentLayerConfig<S, TLoader>;

export function defineLiveCollection<
	L extends LiveLoader,
	S extends BaseSchema | undefined = undefined,
>(config: LiveCollectionConfig<L, S>): LiveCollectionConfig<L, S> {
	const importerFilename = getImporterFilename();
	if (importerFilename && !importerFilename.includes('live.config')) {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'Live collections must be defined in a `src/live.config.ts` file.',
				importerFilename ?? 'your content config file',
			),
		});
	}
	// Default to live content type if not specified
	config.type ??= LIVE_CONTENT_TYPE;

	if (config.type !== LIVE_CONTENT_TYPE) {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'Collections in a live config file must have a type of `live`.',
				importerFilename,
			),
		});
	}

	if (!config.loader) {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'Live collections must have a `loader` defined.',
				importerFilename,
			),
		});
	}

	if (!config.loader.loadCollection || !config.loader.loadEntry) {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'Live collection loaders must have `loadCollection()` and `loadEntry()` methods. Please check that you are not using a loader intended for build-time collections',
				importerFilename,
			),
		});
	}

	if (typeof config.schema === 'function') {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'The schema cannot be a function for live collections. Please use a schema object instead.',
				importerFilename,
			),
		});
	}

	return config;
}

export function defineCollection<
	S extends BaseSchema,
	TLoader extends LoaderConstraint<{ id: string }> = LoaderConstraint<{ id: string }>,
>(config: CollectionConfig<S, TLoader>): CollectionConfig<S, TLoader> {
	const importerFilename = getImporterFilename();

	if (importerFilename?.includes('live.config')) {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'Collections in a live config file must use `defineLiveCollection`.',
				importerFilename,
			),
		});
	}

	if ('loader' in config) {
		if (config.type && config.type !== CONTENT_LAYER_TYPE) {
			throw new AstroUserError(
				`A content collection is defined with legacy features (e.g. missing a \`loader\` or has a \`type\`). Check your collection definitions in ${importerFilename ?? 'your content config file'} to ensure that all collections are defined using the current properties.`,
			);
		}
		if (
			typeof config.loader === 'object' &&
			typeof config.loader.load !== 'function' &&
			('loadEntry' in config.loader || 'loadCollection' in config.loader)
		) {
			throw new AstroUserError(
				`Live content collections must be defined in "src/live.config.ts" file. Check the loaders used in "${importerFilename ?? 'your content config file'}" to ensure you are not using a live loader to define a build-time content collection.`,
			);
		}
		config.type = CONTENT_LAYER_TYPE;
	}
	if (!config.type) config.type = 'content';
	return config;
}
