import { createRedirectsFromAstroRoutes } from '@astrojs/underscore-redirects';
import type { AstroConfig, RouteData } from 'astro';
import esbuild from 'esbuild';
import fs from 'node:fs';
import npath from 'node:path';
import { fileURLToPath } from 'node:url';

export const DENO_SHIM = `globalThis.process = {
	argv: [],
	env: Deno.env.toObject(),
};`;

export interface NetlifyEdgeFunctionsOptions {
	dist?: URL;
}

export interface NetlifyEdgeFunctionManifestFunctionPath {
	function: string;
	path: string;
}

export interface NetlifyEdgeFunctionManifestFunctionPattern {
	function: string;
	pattern: string;
}

export type NetlifyEdgeFunctionManifestFunction =
	| NetlifyEdgeFunctionManifestFunctionPath
	| NetlifyEdgeFunctionManifestFunctionPattern;

export interface NetlifyEdgeFunctionManifest {
	functions: NetlifyEdgeFunctionManifestFunction[];
	version: 1;
}

export async function createRedirects(
	config: AstroConfig,
	routeToDynamicTargetMap: Map<RouteData, string>,
	dir: URL
) {
	const _redirectsURL = new URL('./_redirects', dir);

	const _redirects = createRedirectsFromAstroRoutes({
		config,
		routeToDynamicTargetMap,
		dir,
	});
	const content = _redirects.print();

	// Always use appendFile() because the redirects file could already exist,
	// e.g. due to a `/public/_redirects` file that got copied to the output dir.
	// If the file does not exist yet, appendFile() automatically creates it.
	await fs.promises.appendFile(_redirectsURL, content, 'utf-8');
}

export async function createEdgeManifest(routes: RouteData[], entryFile: string, dir: URL) {
	const functions: NetlifyEdgeFunctionManifestFunction[] = [];
	for (const route of routes) {
		if (route.pathname) {
			functions.push({
				function: entryFile,
				path: route.pathname,
			});
		} else {
			functions.push({
				function: entryFile,
				// Make route pattern serializable to match expected
				// Netlify Edge validation format. Mirrors Netlify's own edge bundler:
				// https://github.com/netlify/edge-bundler/blob/main/src/manifest.ts#L34
				pattern: route.pattern.source.replace(/\\\//g, '/').toString(),
			});
		}
	}

	const manifest: NetlifyEdgeFunctionManifest = {
		functions,
		version: 1,
	};

	const baseDir = new URL('./.netlify/edge-functions/', dir);
	await fs.promises.mkdir(baseDir, { recursive: true });

	const manifestURL = new URL('./manifest.json', baseDir);
	const _manifest = JSON.stringify(manifest, null, '  ');
	await fs.promises.writeFile(manifestURL, _manifest, 'utf-8');
}

export async function bundleServerEntry(entryUrl: URL, serverUrl?: URL, vite?: any | undefined) {
	const pth = fileURLToPath(entryUrl);
	await esbuild.build({
		target: 'es2020',
		platform: 'browser',
		entryPoints: [pth],
		outfile: pth,
		allowOverwrite: true,
		format: 'esm',
		bundle: true,
		external: ['@astrojs/markdown-remark', 'astro/middleware'],
		banner: {
			js: DENO_SHIM,
		},
	});

	// Remove chunks, if they exist. Since we have bundled via esbuild these chunks are trash.
	if (vite && serverUrl) {
		try {
			const chunkFileNames =
				vite?.build?.rollupOptions?.output?.chunkFileNames ?? `chunks/chunk.[hash].mjs`;
			const chunkPath = npath.dirname(chunkFileNames);
			const chunksDirUrl = new URL(chunkPath + '/', serverUrl);
			await fs.promises.rm(chunksDirUrl, { recursive: true, force: true });
		} catch {}
	}
}
