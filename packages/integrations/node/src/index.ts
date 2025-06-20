import { fileURLToPath } from 'node:url';
import type { AstroAdapter, AstroIntegration, NodeAppHeadersJson } from 'astro';
import { AstroError } from 'astro/errors';
import type { Options, UserOptions } from './types.js';
import type { AstroConfig, IntegrationResolvedRoute } from 'astro';
import { writeJson } from '@astrojs/internal-helpers/fs';

export function getAdapter(options: Options): AstroAdapter {
	return {
		name: '@astrojs/node',
		serverEntrypoint: '@astrojs/node/server.js',
		previewEntrypoint: '@astrojs/node/preview.js',
		exports: ['handler', 'startServer', 'options'],
		args: options,
		adapterFeatures: {
			buildOutput: 'server',
			edgeMiddleware: false,
			experimentalStaticHeaders: options.experimentalStaticHeaders,
		},
		supportedAstroFeatures: {
			hybridOutput: 'stable',
			staticOutput: 'stable',
			serverOutput: 'stable',
			sharpImageService: 'stable',
			i18nDomains: 'experimental',
			envGetSecret: 'stable',
		},
	};
}

export default function createIntegration(userOptions: UserOptions): AstroIntegration {
	if (!userOptions?.mode) {
		throw new AstroError(`Setting the 'mode' option is required.`);
	}

	let _options: Options;
	let _config: AstroConfig | undefined = undefined;
	let _routeToHeaders: Map<IntegrationResolvedRoute, Headers> | undefined = undefined;
	return {
		name: '@astrojs/node',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, logger }) => {
				let session = config.session;
				_config = config;
				if (!session?.driver) {
					logger.info('Enabling sessions with filesystem storage');
					session = {
						...session,
						driver: 'fs-lite',
						options: {
							base: fileURLToPath(new URL('sessions', config.cacheDir)),
						},
					};
				}

				updateConfig({
					image: {
						endpoint: {
							route: config.image.endpoint.route ?? '_image',
							entrypoint: config.image.endpoint.entrypoint ?? 'astro/assets/endpoint/node',
						},
					},
					session,
					vite: {
						ssr: {
							noExternal: ['@astrojs/node'],
						},
					},
				});
			},
			'astro:build:generated': ({ experimentalRouteToHeaders }) => {
				_routeToHeaders = experimentalRouteToHeaders;
			},
			'astro:config:done': ({ setAdapter, config }) => {
				_options = {
					...userOptions,
					client: config.build.client?.toString(),
					server: config.build.server?.toString(),
					host: config.server.host,
					port: config.server.port,
					assets: config.build.assets,
					experimentalStaticHeaders: userOptions.experimentalStaticHeaders ?? false,
				};
				setAdapter(getAdapter(_options));
			},
			'astro:build:done': async () => {
				if (!_config) {
					return;
				}

				if (_routeToHeaders && _routeToHeaders.size > 0) {
					const headersFileUrl = new URL('_headers.json', _config.outDir);
					const headersValue: NodeAppHeadersJson = [];

					for (const [route, routeHeaders] of _routeToHeaders.entries()) {
						if (!route.isPrerendered) {
							continue;
						}
						if (route.redirect) {
							continue;
						}
						if (_config.experimental.csp) {
							const csp = routeHeaders.get('Content-Security-Policy');

							if (csp) {
								headersValue.push({
									source: route.pattern,
									headers: [
										{
											key: 'Content-Security-Policy',
											value: csp,
										},
									],
								});
							}
						}
					}

					await writeJson(headersFileUrl, headersValue);
				}
			},
		},
	};
}
