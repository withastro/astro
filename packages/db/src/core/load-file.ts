import { build as esbuild } from 'esbuild';
import { CONFIG_FILE_NAMES, VIRTUAL_MODULE_ID } from './consts.js';
import { fileURLToPath } from 'node:url';
import {
	getConfigVirtualModContents,
	getLocalVirtualModContents,
	getStudioVirtualModContents,
} from './integration/vite-plugin-db.js';
import type { DBTables } from './types.js';
import { writeFile, unlink } from 'node:fs/promises';
import { getDbDirUrl } from './utils.js';
import { existsSync } from 'node:fs';

type ExecuteFileParams =
	| {
			connectToStudio: false;
			fileUrl: URL;
			tables: DBTables;
			root: URL;
	  }
	| {
			connectToStudio: true;
			fileUrl: URL;
			tables: DBTables;
			root: URL;
			appToken: string;
	  };

export async function executeFile(params: ExecuteFileParams): Promise<void> {
	const virtualModContents = params.connectToStudio
		? getStudioVirtualModContents({
				tables: params.tables,
				appToken: params.appToken,
			})
		: getLocalVirtualModContents({
				tables: params.tables,
				root: params.root,
				shouldSeed: false,
				useBundledDbUrl: false,
			});
	const { code } = await bundleFile({ virtualModContents, ...params });
	// Executable files use top-level await. Importing will run the file.
	await importBundledFile({ code, root: params.root });
}

export async function loadConfigFile(
	root: URL
): Promise<{ mod: { default?: unknown } | undefined; dependencies: string[] }> {
	let configFileUrl: URL | undefined;
	for (const fileName of CONFIG_FILE_NAMES) {
		const fileUrl = new URL(fileName, getDbDirUrl(root));
		if (existsSync(fileUrl)) {
			configFileUrl = fileUrl;
		}
	}
	if (!configFileUrl) {
		return { mod: undefined, dependencies: [] };
	}
	const { code, dependencies } = await bundleFile({
		virtualModContents: getConfigVirtualModContents(),
		root,
		fileUrl: configFileUrl,
	});
	return {
		mod: await importBundledFile({ code, root }),
		dependencies,
	};
}

/**
 * Bundle config file to support `.ts` files. Simplified fork from Vite's `bundleConfigFile`
 * function:
 *
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L961
 */
async function bundleFile({
	fileUrl,
	root,
	virtualModContents,
}: {
	fileUrl: URL;
	root: URL;
	virtualModContents: string;
}) {
	const result = await esbuild({
		absWorkingDir: process.cwd(),
		entryPoints: [fileURLToPath(fileUrl)],
		outfile: 'out.js',
		packages: 'external',
		write: false,
		target: ['node16'],
		platform: 'node',
		bundle: true,
		format: 'esm',
		sourcemap: 'inline',
		metafile: true,
		define: {
			'import.meta.env.ASTRO_STUDIO_REMOTE_DB_URL': 'undefined',
		},
		plugins: [
			{
				name: 'resolve-astro-db',
				setup(build) {
					build.onResolve({ filter: /^astro:db$/ }, ({ path }) => {
						return { path, namespace: VIRTUAL_MODULE_ID };
					});
					build.onLoad({ namespace: VIRTUAL_MODULE_ID, filter: /.*/ }, () => {
						return {
							contents: virtualModContents,
							// Needed to resolve runtime dependencies
							resolveDir: fileURLToPath(root),
						};
					});
				},
			},
		],
	});

	const file = result.outputFiles[0];
	if (!file) {
		throw new Error(`Unexpected: no output file`);
	}

	return {
		code: file.text,
		dependencies: Object.keys(result.metafile.inputs),
	};
}

/**
 * Forked from Vite config loader, replacing CJS-based path concat with ESM only
 *
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L1074
 */
async function importBundledFile({
	code,
	root,
}: {
	code: string;
	root: URL;
}): Promise<{ default?: unknown }> {
	// Write it to disk, load it with native Node ESM, then delete the file.
	const tmpFileUrl = new URL(`studio.seed.timestamp-${Date.now()}.mjs`, root);
	await writeFile(tmpFileUrl, code);
	try {
		return await import(/* @vite-ignore */ tmpFileUrl.pathname);
	} finally {
		try {
			await unlink(tmpFileUrl);
		} catch {
			// already removed if this function is called twice simultaneously
		}
	}
}
