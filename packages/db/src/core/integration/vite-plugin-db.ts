import { fileURLToPath } from 'node:url';
import type { AstroConfig } from 'astro';
import { normalizePath } from 'vite';
import { SEED_DEV_FILE_NAME } from '../../runtime/queries.js';
import { DB_PATH, RUNTIME_IMPORT, RUNTIME_VIRTUAL_IMPORT, VIRTUAL_MODULE_ID } from '../consts.js';
import type { DBTables } from '../types.js';
import { type VitePlugin, getDbDirectoryUrl, getRemoteDatabaseUrl } from '../utils.js';

const WITH_SEED_VIRTUAL_MODULE_ID = 'astro:db:seed';

export const resolved = {
	virtual: '\0' + VIRTUAL_MODULE_ID,
	seedVirtual: '\0' + WITH_SEED_VIRTUAL_MODULE_ID,
};

export type LateTables = {
	get: () => DBTables;
};
export type LateSeedFiles = {
	get: () => Array<string | URL>;
};

type VitePluginDBParams =
	| {
			connectToStudio: false;
			tables: LateTables;
			seedFiles: LateSeedFiles;
			srcDir: URL;
			root: URL;
			output: AstroConfig['output'];
	  }
	| {
			connectToStudio: true;
			tables: LateTables;
			appToken: string;
			srcDir: URL;
			root: URL;
			output: AstroConfig['output'];
	  };

export function vitePluginDb(params: VitePluginDBParams): VitePlugin {
	const srcDirPath = normalizePath(fileURLToPath(params.srcDir));
	const dbDirPath = normalizePath(fileURLToPath(getDbDirectoryUrl(params.root)));
	let command: 'build' | 'serve' = 'build';
	return {
		name: 'astro:db',
		enforce: 'pre',
		configResolved(resolvedConfig) {
			command = resolvedConfig.command;
		},
		async resolveId(id, rawImporter) {
			if (id !== VIRTUAL_MODULE_ID) return;
			if (params.connectToStudio) return resolved.virtual;

			const importer = rawImporter ? await this.resolve(rawImporter) : null;
			if (!importer) return resolved.virtual;

			if (importer.id.startsWith(srcDirPath) && !importer.id.startsWith(dbDirPath)) {
				// Seed only if the importer is in the src directory.
				// Otherwise, we may get recursive seed calls (ex. import from db/seed.ts).
				return resolved.seedVirtual;
			}
			return resolved.virtual;
		},
		async load(id) {
			if (id !== resolved.virtual && id !== resolved.seedVirtual) return;

			if (params.connectToStudio) {
				return getStudioVirtualModContents({
					appToken: params.appToken,
					tables: params.tables.get(),
					isBuild: command === 'build',
					output: params.output,
				});
			}
			return getLocalVirtualModContents({
				root: params.root,
				tables: params.tables.get(),
				seedFiles: params.seedFiles.get(),
				shouldSeed: id === resolved.seedVirtual,
			});
		},
	};
}

export function getConfigVirtualModContents() {
	return `export * from ${RUNTIME_VIRTUAL_IMPORT}`;
}

export function getLocalVirtualModContents({
	tables,
	root,
	seedFiles,
	shouldSeed,
}: {
	tables: DBTables;
	seedFiles: Array<string | URL>;
	root: URL;
	shouldSeed: boolean;
}) {
	const userSeedFilePaths = SEED_DEV_FILE_NAME.map(
		// Format as /db/[name].ts
		// for Vite import.meta.glob
		(name) => new URL(name, getDbDirectoryUrl('file:///')).pathname
	);
	const resolveId = (id: string) =>
		id.startsWith('.') ? normalizePath(fileURLToPath(new URL(id, root))) : id;
	// Use top-level imports to correctly resolve `astro:db` within seed files.
	// Dynamic imports cause a silent build failure,
	// potentially because of circular module references.
	const integrationSeedImportStatements: string[] = [];
	const integrationSeedImportNames: string[] = [];
	seedFiles.forEach((pathOrUrl, index) => {
		const path = typeof pathOrUrl === 'string' ? resolveId(pathOrUrl) : pathOrUrl.pathname;
		const importName = 'integration_seed_' + index;
		integrationSeedImportStatements.push(`import ${importName} from ${JSON.stringify(path)};`);
		integrationSeedImportNames.push(importName);
	});

	const dbUrl = new URL(DB_PATH, root);
	return `
import { asDrizzleTable, createLocalDatabaseClient, normalizeDatabaseUrl } from ${RUNTIME_IMPORT};
${shouldSeed ? `import { seedLocal } from ${RUNTIME_IMPORT};` : ''}
${shouldSeed ? integrationSeedImportStatements.join('\n') : ''}

const dbUrl = normalizeDatabaseUrl(import.meta.env.ASTRO_DATABASE_FILE, ${JSON.stringify(dbUrl)});
export const db = createLocalDatabaseClient({ dbUrl });

${
	shouldSeed
		? `await seedLocal({
	db,
	tables: ${JSON.stringify(tables)},
	userSeedGlob: import.meta.glob(${JSON.stringify(userSeedFilePaths)}, { eager: true }),
	integrationSeedFunctions: [${integrationSeedImportNames.join(',')}],
});`
		: ''
}

export * from ${RUNTIME_VIRTUAL_IMPORT};

${getStringifiedTableExports(tables)}`;
}

export function getStudioVirtualModContents({
	tables,
	appToken,
	isBuild,
	output,
}: {
	tables: DBTables;
	appToken: string;
	isBuild: boolean;
	output: AstroConfig['output'];
}) {
	function appTokenArg() {
		if (isBuild) {
			if (output === 'server') {
				// In production build, always read the runtime environment variable.
				return 'process.env.ASTRO_STUDIO_APP_TOKEN';
			} else {
				// Static mode or prerendering needs the local app token.
				return `process.env.ASTRO_STUDIO_APP_TOKEN ?? ${JSON.stringify(appToken)}`;
			}
		} else {
			return JSON.stringify(appToken);
		}
	}

	function dbUrlArg() {
		const dbStr = JSON.stringify(getRemoteDatabaseUrl());
		// Allow overriding, mostly for testing
		return `import.meta.env.ASTRO_STUDIO_REMOTE_DB_URL ?? ${dbStr}`;
	}

	return `
import {asDrizzleTable, createRemoteDatabaseClient} from ${RUNTIME_IMPORT};

export const db = await createRemoteDatabaseClient(${appTokenArg()}, ${dbUrlArg()});

export * from ${RUNTIME_VIRTUAL_IMPORT};

${getStringifiedTableExports(tables)}
	`;
}

function getStringifiedTableExports(tables: DBTables) {
	return Object.entries(tables)
		.map(
			([name, table]) =>
				`export const ${name} = asDrizzleTable(${JSON.stringify(name)}, ${JSON.stringify(
					table
				)}, false)`
		)
		.join('\n');
}
