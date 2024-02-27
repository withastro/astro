import { build as esbuild } from 'esbuild';
import { VIRTUAL_MODULE_ID } from '../../../consts.js';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getStudioVirtualModContents } from '../../../integration/vite-plugin-db.js';
import type { DBTables } from '../../../types.js';
import { writeFile, unlink } from 'node:fs/promises';

export async function executeFile({
	fileUrl,
	tables,
	appToken,
}: {
	fileUrl: URL;
	tables: DBTables;
	appToken: string;
}): Promise<{ default?: unknown } | undefined> {
	const { code } = await bundleFile({ fileUrl, tables, appToken });
	// Executable files use top-level await. Importing will run the file.
	return await importBundledFile(code);
}

/**
 * Bundle config file to support `.ts` files. Simplified fork from Vite's `bundleConfigFile`
 * function:
 *
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L961
 */
async function bundleFile({
	fileUrl,
	tables,
	appToken,
}: {
	fileUrl: URL;
	tables: DBTables;
	appToken: string;
}): Promise<{ code: string }> {
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
							contents: getStudioVirtualModContents({ tables, appToken }),
							// Needed to resolve runtime dependencies
							resolveDir: process.cwd(),
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
	};
}

/**
 * Forked from Vite config loader, replacing CJS-based path concat with ESM only
 *
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L1074
 */
async function importBundledFile(code: string): Promise<{ default?: unknown }> {
	// Write it to disk, load it with native Node ESM, then delete the file.
	const tmpFileUrl = new URL(
		`studio.seed.timestamp-${Date.now()}.mjs`,
		pathToFileURL(process.cwd())
	);
	await writeFile(tmpFileUrl, code);
	try {
		return await import(tmpFileUrl.pathname);
	} finally {
		try {
			await unlink(tmpFileUrl);
		} catch {
			// already removed if this function is called twice simultaneously
		}
	}
}
