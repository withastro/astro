import type { ZodLiteral, ZodNumber, ZodObject, ZodString, ZodType, ZodUnion } from 'zod';
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
export type ImageFunction = () => ZodObject<{
	src: ZodString;
	width: ZodNumber;
	height: ZodNumber;
	format: ZodUnion<
		[
			ZodLiteral<'png'>,
			ZodLiteral<'jpg'>,
			ZodLiteral<'jpeg'>,
			ZodLiteral<'tiff'>,
			ZodLiteral<'webp'>,
			ZodLiteral<'gif'>,
			ZodLiteral<'svg'>,
			ZodLiteral<'avif'>,
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

export type BaseSchema = ZodType;

export type SchemaContext = { image: ImageFunction };

export type LiveCollectionConfig<
	L extends LiveLoader,
	S extends BaseSchema | undefined = undefined,
> = {
	type?: 'live';
	schema?: S;
	loader: L;
};

type LoaderConstraint<TData extends { id: string }> =
	| Loader
	| (() =>
			| Array<TData>
			| Promise<Array<TData>>
			| Record<string, Omit<TData, 'id'> & { id?: string }>
			| Promise<Record<string, Omit<TData, 'id'> & { id?: string }>>);

export type CollectionConfig<
	TSchema extends BaseSchema,
	TLoader extends LoaderConstraint<{ id: string }>,
> = {
	type?: 'content_layer';
	schema?: TSchema | ((context: SchemaContext) => TSchema);
	loader: TLoader;
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

export function defineCollection<
		TSchema extends BaseSchema,
		TLoader extends LoaderConstraint<{ id: string }>,
	>(config: CollectionConfig<TSchema, TLoader>): CollectionConfig<TSchema, TLoader> {
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
		return config;
	}
