import type { AstroConfig } from 'astro';
import './types.js';
/**
 * Load a user’s `astro:db` configuration file and additional configuration files provided by integrations.
 */
export declare function resolveDbConfig({
	root,
	integrations,
}: Pick<AstroConfig, 'root' | 'integrations'>): Promise<{
	/** Resolved `astro:db` config, including tables added by integrations. */
	dbConfig: {
		tables: Record<
			string,
			{
				indexes: Record<
					string,
					{
						on: string | string[];
						unique?: boolean | undefined;
					}
				>;
				columns: Record<
					string,
					| {
							type: 'boolean';
							schema: {
								optional: boolean;
								unique: boolean;
								deprecated: boolean;
								label?: string | undefined;
								name?: string | undefined;
								collection?: string | undefined;
								default?: boolean | import('../runtime/types.js').SerializedSQL | undefined;
							};
					  }
					| {
							type: 'number';
							schema: ({
								unique: boolean;
								deprecated: boolean;
								name?: string | undefined;
								label?: string | undefined;
								collection?: string | undefined;
							} & (
								| {
										primaryKey: false;
										optional: boolean;
										default?: number | import('../runtime/types.js').SerializedSQL | undefined;
								  }
								| {
										primaryKey: true;
										optional?: false | undefined;
										default?: undefined;
								  }
							)) & {
								references?: import('./types.js').NumberColumn;
							};
					  }
					| {
							type: 'text';
							schema: ({
								unique: boolean;
								deprecated: boolean;
								name?: string | undefined;
								label?: string | undefined;
								collection?: string | undefined;
								default?: string | import('../runtime/types.js').SerializedSQL | undefined;
								multiline?: boolean | undefined;
								enum?: [string, ...string[]] | undefined;
							} & (
								| {
										primaryKey: false;
										optional: boolean;
								  }
								| {
										primaryKey: true;
										optional?: false | undefined;
								  }
							)) & {
								references?: import('./types.js').TextColumn;
							};
					  }
					| {
							type: 'date';
							schema: {
								optional: boolean;
								unique: boolean;
								deprecated: boolean;
								label?: string | undefined;
								name?: string | undefined;
								collection?: string | undefined;
								default?: string | import('../runtime/types.js').SerializedSQL | undefined;
							};
					  }
					| {
							type: 'json';
							schema: {
								optional: boolean;
								unique: boolean;
								deprecated: boolean;
								label?: string | undefined;
								name?: string | undefined;
								collection?: string | undefined;
								default?: unknown;
							};
					  }
				>;
				deprecated: boolean;
				foreignKeys?:
					| (Omit<
							{
								columns: import('./schemas.js').MaybeArray<string>;
								references: () => import('./schemas.js').MaybeArray<
									Omit<
										import('zod/v4').input<typeof import('./schemas.js').referenceableColumnSchema>,
										'references'
									>
								>;
							},
							'references'
					  > & {
							references: import('./schemas.js').MaybeArray<
								Omit<
									import('zod/v4').infer<typeof import('./schemas.js').referenceableColumnSchema>,
									'references'
								>
							>;
					  })[]
					| undefined;
			}
		>;
	};
	/** Dependencies imported into the user config file. */
	dependencies: string[];
	/** Additional `astro:db` seed file paths provided by integrations. */
	integrationSeedPaths: (string | URL)[];
}>;
export declare function getResolvedFileUrl(root: URL, filePathOrUrl: string | URL): URL;
/**
 * Bundle arbitrary `mjs` or `ts` file.
 * Simplified fork from Vite's `bundleConfigFile` function.
 *
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L961
 */
export declare function bundleFile({
	fileUrl,
	root,
	virtualModContents,
}: {
	fileUrl: URL;
	root: URL;
	virtualModContents: string;
}): Promise<{
	code: string;
	dependencies: string[];
}>;
/**
 * Forked from Vite config loader, replacing CJS-based path concat with ESM only
 *
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L1074
 */
export declare function importBundledFile({ code, root }: { code: string; root: URL }): Promise<{
	default?: unknown;
}>;
