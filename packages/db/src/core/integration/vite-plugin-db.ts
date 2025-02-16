import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import { BACKEND_MODULE_ID, RUNTIME_VIRTUAL_IMPORT, SEED_DEV_FILE_NAME, VIRTUAL_MODULE_ID } from '../consts.js';
import { getResolvedFileUrl } from '../load-file.js';
import type { DBTables } from '../types.js';
import {
	type VitePlugin,
	getDbDirectoryUrl,
} from '../utils.js';
import type { DatabaseBackend } from '../backend/types.js';

export const resolved = {
	module: '\0' + VIRTUAL_MODULE_ID,
	importedFromSeedFile: '\0' + VIRTUAL_MODULE_ID + ':seed',
	backendModule: '\0' + BACKEND_MODULE_ID,
};

export type LateTables = {
	get: () => DBTables;
};
export type LateSeedFiles = {
	get: () => Array<string | URL>;
};
export type LateBackend<Op = any> = {
	get: () => DatabaseBackend<Op>;
};
export type SeedHandler = {
	inProgress: boolean;
	execute: (fileUrl: URL) => Promise<void>;
};

type VitePluginDBParams =
	(
		| {
			connectToRemote: false;
			seedFiles: LateSeedFiles;
		}
		| { connectToRemote: true; seedFiles?: never; }
	)
	& {
		tables: LateTables;
		srcDir: URL;
		root: URL;
		logger?: AstroIntegrationLogger;
		output: AstroConfig['output'];
		seedHandler: SeedHandler;
		backend: LateBackend;
	};

export function vitePluginDb(params: VitePluginDBParams): VitePlugin {
	return {
		name: 'astro:db',
		enforce: 'pre',
		async resolveId(id) {
			switch (id) {
				case VIRTUAL_MODULE_ID: {
					if (params.seedHandler.inProgress) {
						return resolved.importedFromSeedFile;
					}
					return resolved.module;
				}
				case BACKEND_MODULE_ID:
					return resolved.backendModule;
			}
		},
		async load(id) {
			if (id === resolved.backendModule) {
				return params.backend.get()
					.getDbExportModule(params.connectToRemote ? 'remote' : 'local');
			}

			if (id !== resolved.module && id !== resolved.importedFromSeedFile) return;

			if (params.connectToRemote) {
				return getVirtualModContents({ tables: params.tables.get() })
			}

			// When seeding, we resolved to a different virtual module.
			// this prevents an infinite loop attempting to rerun seed files.
			// Short circuit with the module contents in this case.
			if (id === resolved.importedFromSeedFile) {
				return getVirtualModContents({ tables: params.tables.get() });
			}

			await recreateTables(params);
			const seedFiles = getResolvedSeedFiles(params);
			for await (const seedFile of seedFiles) {
				// Use `addWatchFile()` to invalidate the `astro:db` module
				// when a seed file changes.
				this.addWatchFile(fileURLToPath(seedFile));
				if (existsSync(seedFile)) {
					params.seedHandler.inProgress = true;
					await params.seedHandler.execute(seedFile);
				}
			}
			if (params.seedHandler.inProgress) {
				(params.logger ?? console).info('Seeded database.');
				params.seedHandler.inProgress = false;
			}
			return getVirtualModContents({ tables: params.tables.get() });
		},
	};
}

export function getConfigVirtualModContents() {
	return `export * from ${RUNTIME_VIRTUAL_IMPORT}`;
}

export function getVirtualModContents({ tables }: {
	tables: DBTables;
}) {
	return `
import { asDrizzleTable, createDb } from ${JSON.stringify(BACKEND_MODULE_ID)};

export { db };

export * from ${RUNTIME_VIRTUAL_IMPORT};

${getStringifiedTableExports(tables)}`
}

function getStringifiedTableExports(tables: DBTables) {
	return Object.entries(tables)
		.map(
			([name, table]) =>
				`export const ${name} = asDrizzleTable(${JSON.stringify(name)}, ${JSON.stringify(
					table,
				)}, false)`,
		)
		.join('\n');
}

async function recreateTables<Op>({ tables, backend: lateBackend }: {
	tables: LateTables;
	backend: LateBackend<Op>;
}) {
	const backend = lateBackend.get();
	const setupQueries: Op[] = [];
	for (const [name, table] of Object.entries(tables.get() ?? {})) {
		setupQueries.push(
			...backend.getDropTableIfExistsOps(name),
			...backend.getCreateTableOps(name, table),
			...backend.getCreateIndexOps(name, table),
		);
	}

	await backend.executeOps(setupQueries);
}

function getResolvedSeedFiles({
	root,
	seedFiles,
}: {
	root: URL;
	seedFiles: LateSeedFiles;
}) {
	const localSeedFiles = SEED_DEV_FILE_NAME.map((name) => new URL(name, getDbDirectoryUrl(root)));
	const integrationSeedFiles = seedFiles.get().map((s) => getResolvedFileUrl(root, s));
	return [...integrationSeedFiles, ...localSeedFiles];
}
