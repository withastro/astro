import { fileURLToPath } from 'node:url';
import { writeJson } from '@astrojs/internal-helpers/fs';
import type { AstroAdapter, AstroConfig, AstroIntegration, RouteToHeaders } from 'astro';
import { AstroError } from 'astro/errors';
import { STATIC_HEADERS_FILE } from './shared.js';
import type { NodeAppHeadersJson, Options, UserOptions } from './types.js';
import { sessionDrivers } from 'astro/config';
import { createConfigPlugin } from './vite-plugin-config.js';

export function getAdapter({ staticHeaders }: Pick<Options, 'staticHeaders'>): AstroAdapter {
	return {
		name: '@astrojs/node',
		entrypointResolution: 'auto',
		serverEntrypoint: '@astrojs/node/server.js',
		previewEntrypoint: '@astrojs/node/preview.js',
		adapterFeatures: {
			buildOutput: 'server',
			middlewareMode: 'classic',
			staticHeaders,
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
						driver: sessionDrivers.fsLite({
							base: fileURLToPath(new URL('sessions', config.cacheDir)),
						}),
						cookie: session?.cookie,
						ttl: session?.ttl,
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
						plugins: [
							createConfigPlugin({
								...userOptions,
								client: _config.build.client?.toString(),
								server: _config.build.server?.toString(),
								host: _config.server.host,
								port: _config.server.port,
								staticHeaders: userOptions.staticHeaders ?? false,
								experimentalErrorPageHost,
							}),
						],
					},
				});
			},
			'astro:build:generated': ({ routeToHeaders }) => {
				_routeToHeaders = routeToHeaders;
			},
			'astro:config:done': ({ setAdapter, config }) => {
				_config = config;
				setAdapter(getAdapter({ staticHeaders: userOptions.staticHeaders ?? false }));
			},
			'astro:build:done': async () => {
				if (!_config) {
					return;
				}

				if (_routeToHeaders && _routeToHeaders.size > 0) {
					const headersFileUrl = new URL(STATIC_HEADERS_FILE, _config.outDir);
					const headersValue: NodeAppHeadersJson = [];

					for (const [pathname, { headers }] of _routeToHeaders.entries()) {
						if (_config.security.csp) {
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
