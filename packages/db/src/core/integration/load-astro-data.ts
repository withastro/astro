import { build as esbuild } from 'esbuild';
import { SUPPORTED_DATA_FILES, VIRTUAL_MODULE_ID } from '../consts.js';
import { fileURLToPath } from 'node:url';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { getVirtualModContents } from './vite-plugin-db.js';
import { z } from 'zod';
import type { DBCollections } from '../types.js';

const dataFileSchema = z.object({
	// TODO: robust type checking
	default: z.function().returns(z.void().or(z.promise(z.void()))),
});

export async function loadDataFile({
	root,
	collections,
}: {
	root: URL;
	collections: DBCollections;
}) {
	let fileUrl: URL | undefined;
	for (const filename of SUPPORTED_DATA_FILES) {
		const url = new URL(filename, root);
		if (!existsSync(url)) continue;

		fileUrl = url;
		break;
	}

	if (!fileUrl) {
		return undefined;
	}

	const { code } = await bundleDataFile({ root, fileUrl, collections });
	return dataFileSchema.parse(await loadBundledFile({ code, root }));
}

/**
 * Bundle config file to support `.ts` files. Simplified fork from Vite's `bundleConfigFile`
 * function:
 *
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L961
 */
async function bundleDataFile({
	root,
	fileUrl,
	collections,
}: {
	root: URL;
	fileUrl: URL;
	collections: DBCollections;
}): Promise<{ code: string; dependencies: string[] }> {
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
		plugins: [
			{
				name: 'resolve-astro-db',
				setup(build) {
					build.onResolve({ filter: /^astro:db$/ }, ({ path }) => {
						return { path, namespace: VIRTUAL_MODULE_ID };
					});
					build.onLoad({ namespace: VIRTUAL_MODULE_ID, filter: /.*/ }, () => {
						return {
							contents: getVirtualModContents({ root, collections, isSeed: true }),
							// Needed to resolve `@packages/studio` internals
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
	code: string;
	root: URL;
}): Promise<{ default?: unknown }> {
	// Write it to disk, load it with native Node ESM, then delete the file.
	const tmpFileUrl = new URL(`astro.data.timestamp-${Date.now()}.mjs`, root);
	writeFileSync(tmpFileUrl, code);
	try {
		return await import(/* @vite-ignore */ tmpFileUrl.pathname);
	} finally {
		try {
			unlinkSync(tmpFileUrl);
		} catch {
			// already removed if this function is called twice simultaneously
		}
	}
}
