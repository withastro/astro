import type { AstroAdapter, AstroConfig, AstroIntegration, RouteData } from 'astro';
import {
	bundleServerEntry,
	createEdgeManifest,
	createRedirects,
	type NetlifyEdgeFunctionsOptions,
} from './shared.js';

export function getAdapter(): AstroAdapter {
	return {
		name: '@astrojs/netlify/edge-functions',
		serverEntrypoint: '@astrojs/netlify/netlify-edge-functions.js',
		exports: ['default'],
		supportedAstroFeatures: {
			hybridOutput: 'stable',
			staticOutput: 'stable',
			serverOutput: 'stable',
			assets: {
				supportKind: 'stable',
				isSharpCompatible: false,
				isSquooshCompatible: false,
			},
		},
	};
}

export function netlifyEdgeFunctions({ dist }: NetlifyEdgeFunctionsOptions = {}): AstroIntegration {
	let _config: AstroConfig;
	let entryFile: string;
	let _buildConfig: AstroConfig['build'];
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
						// Netlify expects .js and will always interpret as ESM
						serverEntry: 'entry.js',
					},
				});
			},
			'astro:config:done': ({ config, setAdapter }) => {
				setAdapter(getAdapter());
				_config = config;
				_buildConfig = config.build;
				entryFile = config.build.serverEntry.replace(/\.m?js/, '');

				if (config.output === 'static') {
					console.warn(
						`[@astrojs/netlify] \`output: "server"\` or \`output: "hybrid"\` is required to use this adapter.`
					);
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
				const entryUrl = new URL(_buildConfig.serverEntry, _buildConfig.server);
				await bundleServerEntry(entryUrl, _buildConfig.server, _vite);
				await createEdgeManifest(routes, entryFile, _config.root);
				const dynamicTarget = `/.netlify/edge-functions/${entryFile}`;
				const map: [RouteData, string][] = routes.map((route) => {
					return [route, dynamicTarget];
				});
				const routeToDynamicTargetMap = new Map(Array.from(map));
				await createRedirects(_config, routeToDynamicTargetMap, dir);
			},
		},
	};
}

export { netlifyEdgeFunctions as default };
