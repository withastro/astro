import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type BuildOptions, build as esbuild } from 'esbuild';
import { SUPPORTED_SEED_FILES, VIRTUAL_MODULE_ID } from './consts.js';
import { getVirtualModContents } from './vite-plugin-db.js';
import type { DBCollections } from './types.js';

export async function seed({ collections, root }: { collections: DBCollections; root: URL }) {
	let seedFileUrl: URL | undefined;
	for (const filename of SUPPORTED_SEED_FILES) {
		const fileUrl = new URL(filename, root);
		if (!existsSync(fileUrl)) continue;

		seedFileUrl = fileUrl;
		break;
	}
	if (!seedFileUrl) return;

	const { code } = await bundleFile(seedFileUrl, [
		{
			name: 'resolve-astro-db',
			setup(build) {
				build.onResolve({ filter: /^astro:db$/ }, ({ path }) => {
					return { path, namespace: VIRTUAL_MODULE_ID };
				});
				build.onLoad({ namespace: VIRTUAL_MODULE_ID, filter: /.*/ }, () => {
					return {
						contents: getVirtualModContents({
							collections,
							root,
							isDev: false,
						}),
						// Needed to resolve `@packages/studio` internals
						resolveDir: process.cwd(),
					};
				});
			},
		},
	]);
	// seed file supports top-level await. Runs when config is loaded!
	await loadBundledFile({ code, root });

	console.info('Seeding complete 🌱');
}

/**
 * Bundle config file to support `.ts` files. Simplified fork from Vite's `bundleConfigFile`
 * function:
 *
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L961
 */
async function bundleFile(
	fileUrl: URL,
	esbuildPlugins?: BuildOptions['plugins']
): Promise<{ code: string; dependencies: string[] }> {
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
		plugins: esbuildPlugins,
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
async function loadBundledFile({
	code,
	root,
}: {
	root: URL;
	code: string;
}): Promise<{ default?: unknown }> {
	// Write it to disk, load it with native Node ESM, then delete the file.
	const tmpFileUrl = new URL(`studio.seed.timestamp-${Date.now()}.mjs`, root);
	writeFileSync(tmpFileUrl, code);
	try {
		return await import(tmpFileUrl.pathname);
	} finally {
		try {
			unlinkSync(tmpFileUrl);
		} catch {
			// already removed if this function is called twice simultaneously
		}
	}
}
