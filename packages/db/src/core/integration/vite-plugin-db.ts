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

const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;
const resolvedSeedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID + '/seed';

type LateSchema = {
	tables: () => DBTables;
};

type VitePluginDBParams =
	| {
			connectToStudio: false;
			shouldSeed: boolean;
			schemas: LateSchema;
			root: URL;
	  }
	| {
			connectToStudio: true;
			schemas: LateSchema;
			appToken: string;
			root: URL;
	  };

export function vitePluginDb(params: VitePluginDBParams): VitePlugin {
	const dbDirUrl = getDbDirUrl(params.root);
	return {
		name: 'astro:db',
		enforce: 'pre',
		resolveId(id, importer) {
			if (id === VIRTUAL_MODULE_ID) {
				const resolved = importer?.startsWith(dbDirUrl.pathname)
					? resolvedSeedVirtualModuleId
					: resolvedVirtualModuleId;
				console.log('resolved::', resolved);
				return resolved;
			}
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
				shouldSeed: id !== resolvedSeedVirtualModuleId && params.shouldSeed,
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
import { asDrizzleTable, createLocalDatabaseClient, seedLocal } from ${RUNTIME_IMPORT};
${
	useBundledDbUrl
		? `import dbUrl from ${JSON.stringify(`${dbUrl}?fileurl`)};`
		: `const dbUrl = ${JSON.stringify(dbUrl)};`
}

export const db = createLocalDatabaseClient({ dbUrl });

export * from ${RUNTIME_DRIZZLE_IMPORT};
export * from ${RUNTIME_CONFIG_IMPORT};

${getStringifiedCollectionExports(tables)}

${
	shouldSeed
		? `await seedLocal({
	db,
	tables: ${JSON.stringify(tables)},
	fileGlob: import.meta.glob(${JSON.stringify(seedFilePaths)}),
});`
		: ''
}
`;
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
