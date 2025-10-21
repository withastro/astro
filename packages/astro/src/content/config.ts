import { experimentalZod4 } from 'virtual:astro:config/experimentalZod4';
import type * as z3 from 'zod/v3';
import type * as z4 from 'zod/v4/core';
import { AstroError, AstroErrorData, AstroUserError } from '../core/errors/index.js';
import { checkZodSchemaCompatibility } from '../vite-plugin-experimental-zod4/utils.js';
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
type Z3ImageFunction = () => z3.ZodObject<{
	src: z3.ZodString;
	width: z3.ZodNumber;
	height: z3.ZodNumber;
	format: z3.ZodUnion<
		[
			z3.ZodLiteral<'png'>,
			z3.ZodLiteral<'jpg'>,
			z3.ZodLiteral<'jpeg'>,
			z3.ZodLiteral<'tiff'>,
			z3.ZodLiteral<'webp'>,
			z3.ZodLiteral<'gif'>,
			z3.ZodLiteral<'svg'>,
			z3.ZodLiteral<'avif'>,
		]
	>;
}>;
// This needs to be in sync with ImageMetadata
type Z4ImageFunction = () => z4.$ZodObject<{
	src: z4.$ZodString;
	width: z4.$ZodNumber;
	height: z4.$ZodNumber;
	format: z4.$ZodUnion<
		[
			z4.$ZodLiteral<'png'>,
			z4.$ZodLiteral<'jpg'>,
			z4.$ZodLiteral<'jpeg'>,
			z4.$ZodLiteral<'tiff'>,
			z4.$ZodLiteral<'webp'>,
			z4.$ZodLiteral<'gif'>,
			z4.$ZodLiteral<'svg'>,
			z4.$ZodLiteral<'avif'>,
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

export type BaseSchema = z3.ZodType | z4.$ZodType;

export type LiveCollectionConfig<
	L extends LiveLoader,
	S extends BaseSchema | undefined = undefined,
> = {
	type?: 'live';
	schema?: S;
	loader: L;
};

export type CollectionConfig<S extends BaseSchema> = {
	type?: 'content_layer';
	schema?:
		| S
		| ((context: {
				image: NoInfer<S> extends z4.$ZodType ? Z4ImageFunction : Z3ImageFunction;
		  }) => S);
	loader:
		| Loader
		| (() =>
				| Array<{ id: string }>
				| Promise<Array<{ id: string }>>
				| Record<string, { id?: string }>
				| Promise<Record<string, { id?: string }>>);
};

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

export type DefineZ4Collection = <S extends z4.$ZodType>(
	config: CollectionConfig<S>,
) => CollectionConfig<S>;

export type DefineZ3Collection = <S extends z3.ZodType>(
	config: CollectionConfig<S>,
) => CollectionConfig<S>;

export function defineCollection(
	config: CollectionConfig<BaseSchema>,
): CollectionConfig<BaseSchema> {
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

	if (!('loader' in config)) {
		throw new AstroError({
			...AstroErrorData.ContentCollectionMissingLoader,
			message: AstroErrorData.ContentCollectionMissingLoader.message(importerFilename),
		});
	}

	if (config.type && config.type !== CONTENT_LAYER_TYPE) {
		throw new AstroError({
			...AstroErrorData.ContentCollectionInvalidType,
			message: AstroErrorData.ContentCollectionInvalidType.message(config.type, importerFilename),
		});
	}

	if (
		typeof config.loader === 'object' &&
		typeof config.loader.load !== 'function' &&
		('loadEntry' in config.loader || 'loadCollection' in config.loader)
	) {
		throw new AstroUserError(
			`Live content collections must be defined in "src/live.config.ts" file. Check your collection definitions in "${importerFilename ?? 'your content config file'}" to ensure you are not using a live loader.`,
		);
	}
	config.type = CONTENT_LAYER_TYPE;

	if (
		config.schema &&
		typeof config.schema !== 'function' &&
		'_zod' in config.schema &&
		!experimentalZod4
	) {
		const error = checkZodSchemaCompatibility(
			config.schema,
			experimentalZod4,
			'content collections',
		);
		if (error) {
			throw error;
		}
	}

	return config;
}
