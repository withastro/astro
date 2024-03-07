import { existsSync } from 'node:fs';
import { unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build as esbuild } from 'esbuild';
import { CONFIG_FILE_NAMES, VIRTUAL_MODULE_ID } from './consts.js';
import { getConfigVirtualModContents } from './integration/vite-plugin-db.js';
import { getDbDirectoryUrl } from './utils.js';

export async function loadDbConfigFile(
	root: URL
): Promise<{ mod: { default?: unknown } | undefined; dependencies: string[] }> {
	let configFileUrl: URL | undefined;
	for (const fileName of CONFIG_FILE_NAMES) {
		const fileUrl = new URL(fileName, getDbDirectoryUrl(root));
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
 * Bundle arbitrary `mjs` or `ts` file.
 * Simplified fork from Vite's `bundleConfigFile` function.
 *
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L961
 */
export async function bundleFile({
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
export async function importBundledFile({
	code,
	root,
}: {
	code: string;
	root: URL;
}): Promise<{ default?: unknown }> {
	// Write it to disk, load it with native Node ESM, then delete the file.
	const tmpFileUrl = new URL(`./db.timestamp-${Date.now()}.mjs`, root);
	await writeFile(tmpFileUrl, code, { encoding: 'utf8' });
	try {
		return await import(/* @vite-ignore */ tmpFileUrl.toString());
	} finally {
		try {
			await unlink(tmpFileUrl);
		} catch {
			// already removed if this function is called twice simultaneously
		}
	}
}
