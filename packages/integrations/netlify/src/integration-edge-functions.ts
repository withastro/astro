import type { AstroAdapter, AstroConfig, AstroIntegration, BuildConfig, RouteData } from 'astro';
import esbuild from 'esbuild';
import * as fs from 'fs';
import * as npath from 'path';
import { fileURLToPath } from 'url';
import type { Plugin as VitePlugin } from 'vite';
import { createRedirects } from './shared.js';

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
				pattern: route.pattern.toString(),
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

async function bundleServerEntry(buildConfig: BuildConfig, vite: any) {
	const entryUrl = new URL(buildConfig.serverEntry, buildConfig.server);
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
	});

	// Remove chunks, if they exist. Since we have bundled via esbuild these chunks are trash.
	try {
		const chunkFileNames =
			vite?.build?.rollupOptions?.output?.chunkFileNames ?? 'chunks/chunk.[hash].mjs';
		const chunkPath = npath.dirname(chunkFileNames);
		const chunksDirUrl = new URL(chunkPath + '/', buildConfig.server);
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
				if (dist) {
					config.outDir = dist;
				} else {
					config.outDir = new URL('./dist/', config.root);
				}

				// Add a plugin that shims the global environment.
				const injectPlugin: VitePlugin = {
					name: '@astrojs/netlify/plugin-inject',
					generateBundle(_options, bundle) {
						if (_buildConfig.serverEntry in bundle) {
							const chunk = bundle[_buildConfig.serverEntry];
							if (chunk && chunk.type === 'chunk') {
								chunk.code = `globalThis.process = { argv: [], env: {}, };${chunk.code}`;
							}
						}
					},
				};

				updateConfig({
					vite: {
						plugins: [injectPlugin],
					},
				});
			},
			'astro:config:done': ({ config, setAdapter }) => {
				setAdapter(getAdapter());
				_config = config;
			},
			'astro:build:start': async ({ buildConfig }) => {
				_buildConfig = buildConfig;
				entryFile = buildConfig.serverEntry.replace(/\.m?js/, '');
				buildConfig.client = _config.outDir;
				buildConfig.server = new URL('./.netlify/edge-functions/', _config.root);
				buildConfig.serverEntry = 'entry.js';
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
				await createRedirects(routes, dir, entryFile, true);
			},
		},
	};
}

export { netlifyEdgeFunctions as default };
