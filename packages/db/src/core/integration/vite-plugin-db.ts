import { fileURLToPath } from 'node:url';
import { SEED_DEV_FILE_NAMES_SORTED } from '../../runtime/queries.js';
import {
	DB_PATH,
	RUNTIME_CONFIG_IMPORT,
	RUNTIME_DRIZZLE_IMPORT,
	RUNTIME_IMPORT,
	VIRTUAL_MODULE_ID,
} from '../consts.js';
import type { DBTables } from '../types.js';
import { getDbDirUrl, getRemoteDatabaseUrl, type VitePlugin } from '../utils.js';
import { normalizePath } from 'vite';

const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;
const resolvedSeedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID + '?shouldSeed';

type LateSchema = {
	tables: () => DBTables;
};

type VitePluginDBParams =
	| {
			connectToStudio: false;
			shouldSeed: boolean;
			schemas: LateSchema;
			srcDir: URL;
			root: URL;
	  }
	| {
			connectToStudio: true;
			schemas: LateSchema;
			appToken: string;
			srcDir: URL;
			root: URL;
	  };

export function vitePluginDb(params: VitePluginDBParams): VitePlugin {
	const srcDirPath = normalizePath(fileURLToPath(params.srcDir));
	return {
		name: 'astro:db',
		enforce: 'pre',
		async resolveId(id, rawImporter) {
			if (id !== VIRTUAL_MODULE_ID) return;
			if (params.connectToStudio || !params.shouldSeed) return resolvedVirtualModuleId;

			const importer = rawImporter ? await this.resolve(rawImporter) : null;
			if (!importer) return resolvedVirtualModuleId;

			if (importer.id.startsWith(srcDirPath)) {
				// Seed only if the importer is in the src directory.
				// Otherwise, we may get recursive seed calls (ex. import from db/seed.ts).
				return resolvedSeedVirtualModuleId;
			}
			return resolvedVirtualModuleId;
		},
		load(id) {
			if (id !== resolvedVirtualModuleId && id !== resolvedSeedVirtualModuleId) return;

			if (params.connectToStudio) {
				return getStudioVirtualModContents({
					appToken: params.appToken,
					tables: params.schemas.tables(),
				});
			}
			return getLocalVirtualModContents({
				root: params.root,
				tables: params.schemas.tables(),
				shouldSeed: id === resolvedSeedVirtualModuleId,
			});
		},
	};
}

export function getConfigVirtualModContents() {
	return `export * from ${RUNTIME_CONFIG_IMPORT}`;
}

export function getLocalVirtualModContents({
	tables,
	root,
	shouldSeed,
	useBundledDbUrl = true,
}: {
	tables: DBTables;
	root: URL;
	shouldSeed: boolean;
	/**
	 * Allow `db execute` to use `dbUrl` directly without rollup bundling.
	 * `db execute` loads config with minimal esbuild config instead of vite.
	 */
	useBundledDbUrl?: boolean;
}) {
	const dbUrl = new URL(DB_PATH, root);
	const seedFilePaths = SEED_DEV_FILE_NAMES_SORTED.map(
		// Format as /db/[name].ts
		// for Vite import.meta.glob
		(name) => new URL(name, getDbDirUrl('file:///')).pathname
	);

	return `
import { asDrizzleTable, createLocalDatabaseClient } from ${RUNTIME_IMPORT};
${
	useBundledDbUrl
		? `import dbUrl from ${JSON.stringify(`${dbUrl}?fileurl`)};`
		: `const dbUrl = ${JSON.stringify(dbUrl)};`
}

export const db = await createLocalDatabaseClient({
	dbUrl,
	seedProps: ${
		shouldSeed
			? `{
		tables: ${JSON.stringify(tables)},
		fileGlob: import.meta.glob(${JSON.stringify(seedFilePaths)}),
	}`
			: 'undefined'
	},
});

export * from ${RUNTIME_DRIZZLE_IMPORT};
export * from ${RUNTIME_CONFIG_IMPORT};

${getStringifiedCollectionExports(tables)}`;
}

export function getStudioVirtualModContents({
	tables,
	appToken,
}: {
	tables: DBTables;
	appToken: string;
}) {
	return `
import {asDrizzleTable, createRemoteDatabaseClient} from ${RUNTIME_IMPORT};

export const db = await createRemoteDatabaseClient(${JSON.stringify(
		appToken
		// Respect runtime env for user overrides in SSR
	)}, import.meta.env.ASTRO_STUDIO_REMOTE_DB_URL ?? ${JSON.stringify(getRemoteDatabaseUrl())});
export * from ${RUNTIME_DRIZZLE_IMPORT};
export * from ${RUNTIME_CONFIG_IMPORT};

${getStringifiedCollectionExports(tables)}
	`;
}

function getStringifiedCollectionExports(tables: DBTables) {
	return Object.entries(tables)
		.map(
			([name, collection]) =>
				`export const ${name} = asDrizzleTable(${JSON.stringify(name)}, ${JSON.stringify(
					collection
				)}, false)`
		)
		.join('\n');
}
