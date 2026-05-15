import fsMod from 'node:fs';
import type { PluginContext } from 'rollup';
import type { RunnableDevEnvironment } from 'vite';
import * as z from 'zod/v4';
import type { AstroLogger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
import type { AstroConfig } from '../types/public/config.js';
import type { ContentEntryType, DataEntryType } from '../types/public/content.js';
import { type CONTENT_FLAGS } from './consts.js';
import type { LoaderContext } from './loaders/types.js';
export declare const loaderReturnSchema: z.ZodUnion<
	readonly [
		z.ZodArray<
			z.ZodObject<
				{
					id: z.ZodString;
				},
				z.core.$loose
			>
		>,
		z.ZodRecord<
			z.ZodString,
			z.ZodObject<
				{
					id: z.ZodOptional<z.ZodString>;
				},
				z.core.$loose
			>
		>,
	]
>;
declare const collectionConfigParser: z.ZodUnion<
	readonly [
		z.ZodObject<
			{
				type: z.ZodOptional<z.ZodLiteral<'content'>>;
				schema: z.ZodOptional<z.ZodAny>;
				loader: z.ZodOptional<z.ZodNever>;
			},
			z.core.$strip
		>,
		z.ZodObject<
			{
				type: z.ZodOptional<z.ZodLiteral<'data'>>;
				schema: z.ZodOptional<z.ZodAny>;
				loader: z.ZodOptional<z.ZodNever>;
			},
			z.core.$strip
		>,
		z.ZodObject<
			{
				type: z.ZodLiteral<'content_layer'>;
				schema: z.ZodOptional<z.ZodAny>;
				loader: z.ZodUnion<
					readonly [
						z.ZodFunction<z.core.$ZodFunctionArgs, z.core.$ZodFunctionOut>,
						z.ZodObject<
							{
								name: z.ZodString;
								load: z.ZodFunction<
									z.ZodTuple<readonly [z.ZodCustom<LoaderContext, LoaderContext>], null>,
									z.ZodCustom<
										void | {
											schema?: any;
											types?: string;
										},
										void | {
											schema?: any;
											types?: string;
										}
									>
								>;
								schema: z.ZodOptional<z.ZodPipe<z.ZodAny, z.ZodTransform<any, any>>>;
								createSchema: z.ZodOptional<
									z.ZodFunction<
										z.ZodTuple<readonly [], null>,
										z.ZodPromise<
											z.ZodObject<
												{
													schema: z.ZodCustom<
														z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>,
														z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>
													>;
													types: z.ZodString;
												},
												z.core.$strip
											>
										>
									>
								>;
							},
							z.core.$strip
						>,
					]
				>;
			},
			z.core.$strip
		>,
		z.ZodObject<
			{
				type: z.ZodDefault<z.ZodOptional<z.ZodLiteral<'live'>>>;
				schema: z.ZodOptional<z.ZodAny>;
				loader: z.ZodFunction<z.core.$ZodFunctionArgs, z.core.$ZodFunctionOut>;
			},
			z.core.$strip
		>,
	]
>;
declare const contentConfigParser: z.ZodObject<
	{
		collections: z.ZodRecord<
			z.ZodString,
			z.ZodUnion<
				readonly [
					z.ZodObject<
						{
							type: z.ZodOptional<z.ZodLiteral<'content'>>;
							schema: z.ZodOptional<z.ZodAny>;
							loader: z.ZodOptional<z.ZodNever>;
						},
						z.core.$strip
					>,
					z.ZodObject<
						{
							type: z.ZodOptional<z.ZodLiteral<'data'>>;
							schema: z.ZodOptional<z.ZodAny>;
							loader: z.ZodOptional<z.ZodNever>;
						},
						z.core.$strip
					>,
					z.ZodObject<
						{
							type: z.ZodLiteral<'content_layer'>;
							schema: z.ZodOptional<z.ZodAny>;
							loader: z.ZodUnion<
								readonly [
									z.ZodFunction<z.core.$ZodFunctionArgs, z.core.$ZodFunctionOut>,
									z.ZodObject<
										{
											name: z.ZodString;
											load: z.ZodFunction<
												z.ZodTuple<readonly [z.ZodCustom<LoaderContext, LoaderContext>], null>,
												z.ZodCustom<
													void | {
														schema?: any;
														types?: string;
													},
													void | {
														schema?: any;
														types?: string;
													}
												>
											>;
											schema: z.ZodOptional<z.ZodPipe<z.ZodAny, z.ZodTransform<any, any>>>;
											createSchema: z.ZodOptional<
												z.ZodFunction<
													z.ZodTuple<readonly [], null>,
													z.ZodPromise<
														z.ZodObject<
															{
																schema: z.ZodCustom<
																	z.ZodType<
																		unknown,
																		unknown,
																		z.core.$ZodTypeInternals<unknown, unknown>
																	>,
																	z.ZodType<
																		unknown,
																		unknown,
																		z.core.$ZodTypeInternals<unknown, unknown>
																	>
																>;
																types: z.ZodString;
															},
															z.core.$strip
														>
													>
												>
											>;
										},
										z.core.$strip
									>,
								]
							>;
						},
						z.core.$strip
					>,
					z.ZodObject<
						{
							type: z.ZodDefault<z.ZodOptional<z.ZodLiteral<'live'>>>;
							schema: z.ZodOptional<z.ZodAny>;
							loader: z.ZodFunction<z.core.$ZodFunctionArgs, z.core.$ZodFunctionOut>;
						},
						z.core.$strip
					>,
				]
			>
		>;
	},
	z.core.$strip
>;
export type CollectionConfig = z.infer<typeof collectionConfigParser>;
export type ContentConfig = z.infer<typeof contentConfigParser> & {
	digest?: string;
};
type EntryInternal = {
	rawData: string | undefined;
	filePath: string;
};
export declare function parseEntrySlug({
	id,
	collection,
	generatedSlug,
	frontmatterSlug,
}: {
	id: string;
	collection: string;
	generatedSlug: string;
	frontmatterSlug?: unknown;
}): string;
export declare function getEntryData<
	TInputData extends Record<string, unknown> = Record<string, unknown>,
	TOutputData extends TInputData = TInputData,
>(
	entry: {
		id: string;
		collection: string;
		unvalidatedData: TInputData;
		_internal: EntryInternal;
	},
	collectionConfig: CollectionConfig,
	shouldEmitFile: boolean,
	pluginContext?: PluginContext,
): Promise<TOutputData>;
export declare function getContentEntryExts(
	settings: Pick<AstroSettings, 'contentEntryTypes'>,
): string[];
export declare function getDataEntryExts(settings: Pick<AstroSettings, 'dataEntryTypes'>): string[];
export declare function getEntryConfigByExtMap<TEntryType extends ContentEntryType | DataEntryType>(
	entryTypes: TEntryType[],
): Map<string, TEntryType>;
export declare function getSymlinkedContentCollections({
	contentDir,
	logger,
	fs,
}: {
	contentDir: URL;
	logger: AstroLogger;
	fs: typeof fsMod;
}): Promise<Map<string, string>>;
export declare function reverseSymlink({
	entry,
	symlinks,
	contentDir,
}: {
	entry: string | URL;
	contentDir: string | URL;
	symlinks?: Map<string, string>;
}): string;
export declare function getEntryCollectionName({
	contentDir,
	entry,
}: Pick<ContentPaths, 'contentDir'> & {
	entry: string | URL;
}): string | undefined;
export declare function getDataEntryId({
	entry,
	contentDir,
	collection,
}: Pick<ContentPaths, 'contentDir'> & {
	entry: URL;
	collection: string;
}): string;
export declare function getContentEntryIdAndSlug({
	entry,
	contentDir,
	collection,
}: Pick<ContentPaths, 'contentDir'> & {
	entry: URL;
	collection: string;
}): {
	id: string;
	slug: string;
};
export declare function getEntryType(
	entryPath: string,
	paths: Pick<ContentPaths, 'config' | 'contentDir' | 'root'>,
	contentFileExts: string[],
	dataFileExts: string[],
): 'content' | 'data' | 'config' | 'ignored';
export declare function safeParseFrontmatter(
	source: string,
	id?: string,
): import('@astrojs/markdown-remark').ParseFrontmatterResult;
/**
 * The content config is loaded separately from other `src/` files.
 * This global observable lets dependent plugins (like the content flag plugin)
 * subscribe to changes during dev server updates.
 */
export declare const globalContentConfigObserver: ContentObservable;
export declare function hasContentFlag(
	viteId: string,
	flag: (typeof CONTENT_FLAGS)[number],
): boolean;
export declare function isDeferredModule(viteId: string): boolean;
export declare function reloadContentConfigObserver({
	observer,
	...loadContentConfigOpts
}: {
	fs: typeof fsMod;
	settings: AstroSettings;
	environment: RunnableDevEnvironment;
	observer?: ContentObservable;
}): Promise<void>;
type ContentCtx =
	| {
			status: 'init';
	  }
	| {
			status: 'loading';
	  }
	| {
			status: 'does-not-exist';
	  }
	| {
			status: 'loaded';
			config: ContentConfig;
	  }
	| {
			status: 'error';
			error: Error;
	  };
type Observable<C> = {
	get: () => C;
	set: (ctx: C) => void;
	subscribe: (fn: (ctx: C) => void) => () => void;
};
export type ContentObservable = Observable<ContentCtx>;
export type ContentPaths = {
	root: URL;
	contentDir: URL;
	assetsDir: URL;
	typesTemplate: URL;
	virtualModTemplate: URL;
	config: {
		exists: boolean;
		url: URL;
	};
	liveConfig: {
		exists: boolean;
		url: URL;
	};
};
export declare function getContentPaths(
	{ srcDir, root }: Pick<AstroConfig, 'root' | 'srcDir'>,
	fs?: typeof fsMod,
	legacyCollectionsBackwardsCompat?: boolean,
): ContentPaths;
/**
 * Check for slug in content entry frontmatter and validate the type,
 * falling back to the `generatedSlug` if none is found.
 */
export declare function getEntrySlug({
	id,
	collection,
	generatedSlug,
	contentEntryType,
	fileUrl,
	fs,
}: {
	fs: typeof fsMod;
	id: string;
	collection: string;
	generatedSlug: string;
	fileUrl: URL;
	contentEntryType: Pick<ContentEntryType, 'getEntryInfo'>;
}): Promise<string>;
/**
 * Unlike `path.posix.relative`, this function will accept a platform path and return a posix path.
 */
export declare function posixRelative(from: string, to: string): string;
export declare function contentModuleToId(fileName: string): string;
export declare function safeStringify(value: unknown): string;
export {};
