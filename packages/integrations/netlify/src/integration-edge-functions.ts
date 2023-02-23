import type { AstroAdapter, AstroConfig, AstroIntegration, RouteData } from 'astro';
import esbuild from 'esbuild';
import * as fs from 'fs';
import * as npath from 'path';
import { fileURLToPath } from 'url';
import { createRedirects } from './shared.js';

interface BuildConfig {
	server: URL;
	client: URL;
	serverEntry: string;
	assets: string;
}

const SHIM = `globalThis.process = {
	argv: [],
	env: Deno.env.toObject(),
};`;

export function getAdapter(): AstroAdapter {
	return {
		name: '@astrojs/netlify/edge-functions',
		serverEntrypoint: '@astrojs/netlify/netlify-edge-functions.js',
		exports: ['default'],
	};
}

interface NetlifyEdgeFunctionsOptions {
	dist?: URL;
}

interface NetlifyEdgeFunctionManifestFunctionPath {
	function: string;
	path: string;
}

interface NetlifyEdgeFunctionManifestFunctionPattern {
	function: string;
	pattern: string;
}

type NetlifyEdgeFunctionManifestFunction =
	| NetlifyEdgeFunctionManifestFunctionPath
	| NetlifyEdgeFunctionManifestFunctionPattern;

interface NetlifyEdgeFunctionManifest {
	functions: NetlifyEdgeFunctionManifestFunction[];
	version: 1;
}

async function createEdgeManifest(routes: RouteData[], entryFile: string, dir: URL) {
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

async function bundleServerEntry({ serverEntry, server }: BuildConfig, vite: any) {
	const entryUrl = new URL(serverEntry, server);
	const pth = fileURLToPath(entryUrl);
	await esbuild.build({
		target: 'es2020',
		platform: 'browser',
		entryPoints: [pth],
		outfile: pth,
		allowOverwrite: true,
		format: 'esm',
		bundle: true,
		external: ['@astrojs/markdown-remark'],
		banner: {
			js: SHIM,
		},
	});

	// Remove chunks, if they exist. Since we have bundled via esbuild these chunks are trash.
	try {
		const chunkFileNames =
			vite?.build?.rollupOptions?.output?.chunkFileNames ?? `chunks/chunk.[hash].mjs`;
		const chunkPath = npath.dirname(chunkFileNames);
		const chunksDirUrl = new URL(chunkPath + '/', server);
		await fs.promises.rm(chunksDirUrl, { recursive: true, force: true });
	} catch {}
}

export function netlifyEdgeFunctions({ dist }: NetlifyEdgeFunctionsOptions = {}): AstroIntegration {
	let _config: AstroConfig;
	let entryFile: string;
	let _buildConfig: BuildConfig;
	let _vite: any;
	return {
		name: '@astrojs/netlify/edge-functions',
		hooks: {
			'astro:config:setup': ({ config, updateConfig }) => {
				const outDir = dist ?? new URL('./dist/', config.root);
				updateConfig({
					outDir,
					build: {
						client: outDir,
						server: new URL('./.netlify/edge-functions/', config.root),
						serverEntry: 'entry.mjs',
					},
				});
			},
			'astro:config:done': ({ config, setAdapter }) => {
				setAdapter(getAdapter());
				_config = config;
				_buildConfig = config.build;
				entryFile = config.build.serverEntry.replace(/\.m?js/, '');

				if (config.output === 'static') {
					console.warn(`[@astrojs/netlify] \`output: "server"\` is required to use this adapter.`);
					console.warn(
						`[@astrojs/netlify] Otherwise, this adapter is not required to deploy a static site to Netlify.`
					);
				}
			},
			'astro:build:setup': ({ vite, target }) => {
				if (target === 'server') {
					_vite = vite;
					vite.resolve = vite.resolve || {};
					vite.resolve.alias = vite.resolve.alias || {};

					const aliases = [{ find: 'react-dom/server', replacement: 'react-dom/server.browser' }];

					if (Array.isArray(vite.resolve.alias)) {
						vite.resolve.alias = [...vite.resolve.alias, ...aliases];
					} else {
						for (const alias of aliases) {
							(vite.resolve.alias as Record<string, string>)[alias.find] = alias.replacement;
						}
					}

					vite.ssr = {
						noExternal: true,
					};
				}
			},
			'astro:build:done': async ({ routes, dir }) => {
				await bundleServerEntry(_buildConfig, _vite);
				await createEdgeManifest(routes, entryFile, _config.root);
				await createRedirects(_config, routes, dir, entryFile, 'edge-functions');
			},
		},
	};
}

export { netlifyEdgeFunctions as default };
