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

export default function createIntegration(userOptions: UserOptions): AstroIntegration {
	if (!userOptions?.mode) {
		throw new AstroError(`Setting the 'mode' option is required.`);
	}

	// Validated here rather than at the server: options cross a JSON boundary on their way
	// to the built entrypoint, which turns `Infinity` and `NaN` into `null`, and Node.js
	// assigns any value to `keepAliveTimeout` without complaint. Both would silently
	// disable the timeout — the opposite of what the option is for.
	const { keepAliveTimeout } = userOptions;
	if (
		keepAliveTimeout !== undefined &&
		(!Number.isFinite(keepAliveTimeout) || keepAliveTimeout < 0)
	) {
		throw new AstroError(
			`The 'keepAliveTimeout' option must be a finite, non-negative number of milliseconds.`,
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
				if (session !== false && !session?.driver) {
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
						plugins: [
							createConfigPlugin({
								...userOptions,
								client: _config.build.client?.toString(),
								server: _config.build.server?.toString(),
								host: _config.server.host,
								port: _config.server.port,
								staticHeaders: userOptions.staticHeaders ?? false,
								bodySizeLimit: userOptions.bodySizeLimit ?? 1024 * 1024 * 1024,
								experimentalDisableStreaming: userOptions.experimentalDisableStreaming ?? false,
								// Passed explicitly so the virtual config module always declares the export,
								// even when unset — the server reads it off a module namespace object.
								keepAliveTimeout: userOptions.keepAliveTimeout,
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
