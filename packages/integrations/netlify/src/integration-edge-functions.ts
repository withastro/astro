import type { AstroAdapter, AstroIntegration, AstroConfig, RouteData } from 'astro';
import * as fs from 'fs';

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

	const baseDir = new URL('./.netlify/edge-functions/', dir)
	await fs.promises.mkdir(baseDir, { recursive: true });

	const manifestURL = new URL('./manifest.json', baseDir);
	const _manifest = JSON.stringify(manifest, null, '  ');
	await fs.promises.writeFile(manifestURL, _manifest, 'utf-8');
}

export function netlifyEdgeFunctions({ dist }: NetlifyEdgeFunctionsOptions = {}): AstroIntegration {
	let _config: AstroConfig;
	let entryFile: string;
	return {
		name: '@astrojs/netlify/edge-functions',
		hooks: {
			'astro:config:setup': ({ config }) => {
				if (dist) {
					config.outDir = dist;
				} else {
					config.outDir = new URL('./netlify/', config.root);
				}
			},
			'astro:config:done': ({ config, setAdapter }) => {
				setAdapter(getAdapter());
				_config = config;
			},
			'astro:build:start': async ({ buildConfig }) => {
				entryFile = buildConfig.serverEntry.replace(/\.m?js/, '');
				buildConfig.client = _config.outDir;
				buildConfig.server = new URL('./edge-functions/', _config.outDir);
				buildConfig.serverEntry = 'entry.js';
			},
			'astro:build:setup': ({ vite, target }) => {
				if (target === 'server') {
					vite.ssr = {
						noExternal: true,
					};
				}
			},
			'astro:build:done': async ({ routes, dir }) => {
				await createEdgeManifest(routes, entryFile, _config.root);
			},
		},
	};
}

export { netlifyEdgeFunctions as default };
