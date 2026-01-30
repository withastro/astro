import { fileURLToPath } from 'node:url';
import { writeJson } from '@astrojs/internal-helpers/fs';
import type {
	AstroAdapter,
	AstroConfig,
	AstroIntegration,
	NodeAppHeadersJson,
	RouteToHeaders,
} from 'astro';
import { AstroError } from 'astro/errors';
import { STATIC_HEADERS_FILE } from './shared.js';
import type { Options, UserOptions } from './types.js';

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

const protocols = ['http:', 'https:'];

export default function createIntegration(userOptions: UserOptions): AstroIntegration {
	if (!userOptions?.mode) {
		throw new AstroError(`Setting the 'mode' option is required.`);
	}
	const { experimentalErrorPageHost } = userOptions;
	if (
		experimentalErrorPageHost &&
		(!URL.canParse(experimentalErrorPageHost) ||
			!protocols.includes(new URL(experimentalErrorPageHost).protocol))
	) {
		throw new AstroError(
			`Invalid experimentalErrorPageHost: ${experimentalErrorPageHost}. It should be a valid URL.`,
		);
	}

	let _options: Options;
	let _config: AstroConfig | undefined = undefined;
	let _routeToHeaders: RouteToHeaders | undefined = undefined;
	return {
		name: '@astrojs/node',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, logger, command }) => {
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
					build: {
						redirects: false,
					},
					image: {
						endpoint: {
							route: config.image.endpoint.route ?? '_image',
							entrypoint:
								config.image.endpoint.entrypoint ??
								(command === 'dev' ? 'astro/assets/endpoint/dev' : 'astro/assets/endpoint/node'),
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
					experimentalErrorPageHost,
				};
				setAdapter(getAdapter(_options));
			},
			'astro:build:done': async () => {
				if (!_config) {
					return;
				}

				if (_routeToHeaders && _routeToHeaders.size > 0) {
					const headersFileUrl = new URL(STATIC_HEADERS_FILE, _config.outDir);
					const headersValue: NodeAppHeadersJson = [];

					for (const [pathname, { headers }] of _routeToHeaders.entries()) {
						if (_config.experimental.csp) {
							const csp = headers.get('Content-Security-Policy');
							if (csp) {
								headersValue.push({
									pathname,
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
