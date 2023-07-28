import type { AstroAdapter, AstroConfig, AstroIntegration, RouteData } from 'astro';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateEdgeMiddleware } from './middleware.js';
import type { Args } from './netlify-functions.js';
import { createRedirects } from './shared.js';

export const NETLIFY_EDGE_MIDDLEWARE_FILE = 'netlify-edge-middleware';
export const ASTRO_LOCALS_HEADER = 'x-astro-locals';

export function getAdapter({ functionPerRoute, edgeMiddleware, ...args }: Args): AstroAdapter {
	return {
		name: '@astrojs/netlify/functions',
		serverEntrypoint: '@astrojs/netlify/netlify-functions.js',
		exports: ['handler'],
		args,
		adapterFeatures: {
			functionPerRoute,
			edgeMiddleware,
		},
		supportedAstroFeatures: {
			hybridOutput: 'stable',
			staticOutput: 'stable',
			serverOutput: 'stable',
			assets: {
				supportKind: 'stable',
				isSharpCompatible: true,
				isSquooshCompatible: true,
			},
		},
	};
}

interface NetlifyFunctionsOptions {
	dist?: URL;
	builders?: boolean;
	binaryMediaTypes?: string[];
	edgeMiddleware?: boolean;
	functionPerRoute?: boolean;
}

function netlifyFunctions({
	dist,
	builders,
	binaryMediaTypes,
	functionPerRoute = false,
	edgeMiddleware = false,
}: NetlifyFunctionsOptions = {}): AstroIntegration {
	let _config: AstroConfig;
	let _entryPoints: Map<RouteData, URL>;
	let ssrEntryFile: string;
	let _middlewareEntryPoint: URL;
	return {
		name: '@astrojs/netlify',
		hooks: {
			'astro:config:setup': ({ config, updateConfig }) => {
				const outDir = dist ?? new URL('./dist/', config.root);
				updateConfig({
					outDir,
					build: {
						redirects: false,
						client: outDir,
						server: new URL('./.netlify/functions-internal/', config.root),
					},
				});
			},
			'astro:build:ssr': async ({ entryPoints, middlewareEntryPoint }) => {
				if (middlewareEntryPoint) {
					_middlewareEntryPoint = middlewareEntryPoint;
				}
				_entryPoints = entryPoints;
			},
			'astro:config:done': ({ config, setAdapter }) => {
				setAdapter(getAdapter({ binaryMediaTypes, builders, functionPerRoute, edgeMiddleware }));
				_config = config;
				ssrEntryFile = config.build.serverEntry.replace(/\.m?js/, '');

				if (config.output === 'static') {
					console.warn(
						`[@astrojs/netlify] \`output: "server"\` or \`output: "hybrid"\` is required to use this adapter.`
					);
					console.warn(
						`[@astrojs/netlify] Otherwise, this adapter is not required to deploy a static site to Netlify.`
					);
				}
			},
			'astro:build:done': async ({ routes, dir }) => {
				const type = builders ? 'builders' : 'functions';
				const kind = type ?? 'functions';

				if (_entryPoints.size) {
					const routeToDynamicTargetMap = new Map();
					for (const [route, entryFile] of _entryPoints) {
						const wholeFileUrl = fileURLToPath(entryFile);

						const extension = extname(wholeFileUrl);
						const relative = wholeFileUrl
							.replace(fileURLToPath(_config.build.server), '')
							.replace(extension, '')
							.replaceAll('\\', '/');
						const dynamicTarget = `/.netlify/${kind}/${relative}`;

						routeToDynamicTargetMap.set(route, dynamicTarget);
					}
					await createRedirects(_config, routeToDynamicTargetMap, dir);
				} else {
					const dynamicTarget = `/.netlify/${kind}/${ssrEntryFile}`;
					const map: [RouteData, string][] = routes.map((route) => {
						return [route, dynamicTarget];
					});
					const routeToDynamicTargetMap = new Map(Array.from(map));

					await createRedirects(_config, routeToDynamicTargetMap, dir);
				}
				if (_middlewareEntryPoint) {
					const outPath = fileURLToPath(new URL('./.netlify/edge-functions/', _config.root));
					const netlifyEdgeMiddlewareHandlerPath = new URL(
						NETLIFY_EDGE_MIDDLEWARE_FILE,
						_config.srcDir
					);
					await generateEdgeMiddleware(
						_middlewareEntryPoint,
						outPath,
						netlifyEdgeMiddlewareHandlerPath
					);
				}
			},
		},
	};
}

export { netlifyFunctions as default, netlifyFunctions };
