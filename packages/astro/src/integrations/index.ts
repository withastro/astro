import { bold } from 'kleur/colors';
import fs from 'node:fs';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import type { InlineConfig, ViteDevServer } from 'vite';
import type {
	AstroAdapter,
	AstroConfig,
	AstroIntegration,
	AstroRenderer,
	AstroSettings,
	ContentEntryType,
	DataEntryType,
	HookParameters,
	RouteData,
} from '../@types/astro.js';
import type { SerializedSSRManifest } from '../core/app/types';
import type { PageBuildData } from '../core/build/types';
import { buildClientDirectiveEntrypoint } from '../core/client-directive/index.js';
import { mergeConfig } from '../core/config/index.js';
import { AstroIntegrationLogger, error, info, warn, type LogOptions } from '../core/logger/core.js';
import { isServerLikeOutput } from '../prerender/utils.js';
import { validateSupportedFeatures } from './astroFeaturesValidation.js';

async function withTakingALongTimeMsg<T>({
	name,
	hookResult,
	timeoutMs = 3000,
	logging,
}: {
	name: string;
	hookResult: T | Promise<T>;
	timeoutMs?: number;
	logging: LogOptions;
}): Promise<T> {
	const timeout = setTimeout(() => {
		info(logging, 'build', `Waiting for the ${bold(name)} integration...`);
	}, timeoutMs);
	const result = await hookResult;
	clearTimeout(timeout);
	return result;
}

// Used internally to store instances of loggers.
const Loggers = new WeakMap<AstroIntegration, AstroIntegrationLogger>();

function getLogger(integration: AstroIntegration, logging: LogOptions) {
	if (Loggers.has(integration)) {
		// SAFETY: we check the existence in the if block
		return Loggers.get(integration)!;
	}
	const logger = new AstroIntegrationLogger(logging, integration.name);
	Loggers.set(integration, logger);
	return logger;
}

export async function runHookConfigSetup({
	settings,
	command,
	logging,
	isRestart = false,
}: {
	settings: AstroSettings;
	command: 'dev' | 'build' | 'preview';
	logging: LogOptions;
	isRestart?: boolean;
}): Promise<AstroSettings> {
	// An adapter is an integration, so if one is provided push it.
	if (settings.config.adapter) {
		settings.config.integrations.push(settings.config.adapter);
	}

	let updatedConfig: AstroConfig = { ...settings.config };
	let updatedSettings: AstroSettings = { ...settings, config: updatedConfig };
	let addedClientDirectives = new Map<string, Promise<string>>();

	for (const integration of settings.config.integrations) {
		/**
		 * By making integration hooks optional, Astro can now ignore null or undefined Integrations
		 * instead of giving an internal error most people can't read
		 *
		 * This also enables optional integrations, e.g.
		 * ```ts
		 * integration: [
		 *   // Only run `compress` integration in production environments, etc...
		 *   import.meta.env.production ? compress() : null
		 * ]
		 * ```
		 */
		if (integration.hooks?.['astro:config:setup']) {
			const logger = getLogger(integration, logging);

			const hooks: HookParameters<'astro:config:setup'> = {
				config: updatedConfig,
				command,
				isRestart,
				addRenderer(renderer: AstroRenderer) {
					if (!renderer.name) {
						throw new Error(`Integration ${bold(integration.name)} has an unnamed renderer.`);
					}

					if (!renderer.serverEntrypoint) {
						throw new Error(`Renderer ${bold(renderer.name)} does not provide a serverEntrypoint.`);
					}

					updatedSettings.renderers.push(renderer);
				},
				injectScript: (stage, content) => {
					updatedSettings.scripts.push({ stage, content });
				},
				updateConfig: (newConfig) => {
					updatedConfig = mergeConfig(updatedConfig, newConfig) as AstroConfig;
				},
				injectRoute: (injectRoute) => {
					updatedSettings.injectedRoutes.push(injectRoute);
				},
				addWatchFile: (path) => {
					updatedSettings.watchFiles.push(path instanceof URL ? fileURLToPath(path) : path);
				},
				addClientDirective: ({ name, entrypoint }) => {
					if (updatedSettings.clientDirectives.has(name) || addedClientDirectives.has(name)) {
						throw new Error(
							`The "${integration.name}" integration is trying to add the "${name}" client directive, but it already exists.`
						);
					}
					addedClientDirectives.set(name, buildClientDirectiveEntrypoint(name, entrypoint));
				},
				logger,
			};

			// ---
			// Public, intentionally undocumented hooks - not subject to semver.
			// Intended for internal integrations (ex. `@astrojs/mdx`),
			// though accessible to integration authors if discovered.

			function addPageExtension(...input: (string | string[])[]) {
				const exts = (input.flat(Infinity) as string[]).map((ext) => `.${ext.replace(/^\./, '')}`);
				updatedSettings.pageExtensions.push(...exts);
			}
			function addContentEntryType(contentEntryType: ContentEntryType) {
				updatedSettings.contentEntryTypes.push(contentEntryType);
			}
			function addDataEntryType(dataEntryType: DataEntryType) {
				updatedSettings.dataEntryTypes.push(dataEntryType);
			}

			Object.defineProperty(hooks, 'addPageExtension', {
				value: addPageExtension,
				writable: false,
				enumerable: false,
			});
			Object.defineProperty(hooks, 'addContentEntryType', {
				value: addContentEntryType,
				writable: false,
				enumerable: false,
			});
			Object.defineProperty(hooks, 'addDataEntryType', {
				value: addDataEntryType,
				writable: false,
				enumerable: false,
			});
			// ---

			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:config:setup'](hooks),
				logging,
			});

			// Add custom client directives to settings, waiting for compiled code by esbuild
			for (const [name, compiled] of addedClientDirectives) {
				updatedSettings.clientDirectives.set(name, await compiled);
			}
		}
	}

	updatedSettings.config = updatedConfig;
	return updatedSettings;
}

export async function runHookConfigDone({
	settings,
	logging,
}: {
	settings: AstroSettings;
	logging: LogOptions;
}) {
	for (const integration of settings.config.integrations) {
		const logger = getLogger(integration, logging);
		if (integration?.hooks?.['astro:config:done']) {
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:config:done']({
					config: settings.config,
					setAdapter(adapter) {
						if (settings.adapter && settings.adapter.name !== adapter.name) {
							throw new Error(
								`Integration "${integration.name}" conflicts with "${settings.adapter.name}". You can only configure one deployment integration.`
							);
						}
						if (!adapter.supportedAstroFeatures) {
							// NOTE: throw an error in Astro 4.0
							warn(
								logging,
								'astro',
								`The adapter ${adapter.name} doesn't provide a feature map. From Astro 3.0, an adapter can provide a feature map. Not providing a feature map will cause an error in Astro 4.0.`
							);
						} else {
							const validationResult = validateSupportedFeatures(
								adapter.name,
								adapter.supportedAstroFeatures,
								settings.config,
								logging
							);
							for (const [featureName, supported] of Object.entries(validationResult)) {
								if (!supported) {
									error(
										logging,
										'astro',
										`The adapter ${adapter.name} doesn't support the feature ${featureName}. Your project won't be built. You should not use it.`
									);
								}
							}
							if (!validationResult.assets) {
								info(
									logging,
									'astro',
									`The selected adapter ${adapter.name} does not support Sharp or Squoosh for image processing. To ensure your project is still able to build, image processing has been disabled.`
								);
								settings.config.image.service = {
									entrypoint: 'astro/assets/services/noop',
									config: {},
								};
							}
						}
						settings.adapter = adapter;
					},
					logger,
				}),
				logging,
			});
		}
	}
}

export async function runHookServerSetup({
	config,
	server,
	logging,
}: {
	config: AstroConfig;
	server: ViteDevServer;
	logging: LogOptions;
}) {
	for (const integration of config.integrations) {
		if (integration?.hooks?.['astro:server:setup']) {
			const logger = getLogger(integration, logging);
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:server:setup']({ server, logger }),
				logging,
			});
		}
	}
}

export async function runHookServerStart({
	config,
	address,
	logging,
}: {
	config: AstroConfig;
	address: AddressInfo;
	logging: LogOptions;
}) {
	for (const integration of config.integrations) {
		const logger = getLogger(integration, logging);

		if (integration?.hooks?.['astro:server:start']) {
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:server:start']({ address, logger }),
				logging,
			});
		}
	}
}

export async function runHookServerDone({
	config,
	logging,
}: {
	config: AstroConfig;
	logging: LogOptions;
}) {
	for (const integration of config.integrations) {
		const logger = getLogger(integration, logging);

		if (integration?.hooks?.['astro:server:done']) {
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:server:done']({ logger }),
				logging,
			});
		}
	}
}

export async function runHookBuildStart({
	config,
	logging,
}: {
	config: AstroConfig;
	logging: LogOptions;
}) {
	for (const integration of config.integrations) {
		if (integration?.hooks?.['astro:build:start']) {
			const logger = getLogger(integration, logging);

			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:build:start']({ logger }),
				logging,
			});
		}
	}
}

export async function runHookBuildSetup({
	config,
	vite,
	pages,
	target,
	logging,
}: {
	config: AstroConfig;
	vite: InlineConfig;
	pages: Map<string, PageBuildData>;
	target: 'server' | 'client';
	logging: LogOptions;
}): Promise<InlineConfig> {
	let updatedConfig = vite;

	for (const integration of config.integrations) {
		if (integration?.hooks?.['astro:build:setup']) {
			const logger = getLogger(integration, logging);

			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:build:setup']({
					vite,
					pages,
					target,
					updateConfig: (newConfig) => {
						updatedConfig = mergeConfig(updatedConfig, newConfig);
					},
					logger,
				}),
				logging,
			});
		}
	}

	return updatedConfig;
}

type RunHookBuildSsr = {
	config: AstroConfig;
	manifest: SerializedSSRManifest;
	logging: LogOptions;
	entryPoints: Map<RouteData, URL>;
	middlewareEntryPoint: URL | undefined;
};

export async function runHookBuildSsr({
	config,
	manifest,
	logging,
	entryPoints,
	middlewareEntryPoint,
}: RunHookBuildSsr) {
	for (const integration of config.integrations) {
		if (integration?.hooks?.['astro:build:ssr']) {
			const logger = getLogger(integration, logging);

			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:build:ssr']({
					manifest,
					entryPoints,
					middlewareEntryPoint,
					logger,
				}),
				logging,
			});
		}
	}
}

export async function runHookBuildGenerated({
	config,
	logging,
}: {
	config: AstroConfig;
	logging: LogOptions;
}) {
	const dir = isServerLikeOutput(config) ? config.build.client : config.outDir;

	for (const integration of config.integrations) {
		const logger = getLogger(integration, logging);

		if (integration?.hooks?.['astro:build:generated']) {
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:build:generated']({ dir, logger }),
				logging,
			});
		}
	}
}

type RunHookBuildDone = {
	config: AstroConfig;
	pages: string[];
	routes: RouteData[];
	logging: LogOptions;
};

export async function runHookBuildDone({ config, pages, routes, logging }: RunHookBuildDone) {
	const dir = isServerLikeOutput(config) ? config.build.client : config.outDir;
	await fs.promises.mkdir(dir, { recursive: true });

	for (const integration of config.integrations) {
		if (integration?.hooks?.['astro:build:done']) {
			const logger = getLogger(integration, logging);

			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:build:done']({
					pages: pages.map((p) => ({ pathname: p })),
					dir,
					routes,
					logger,
				}),
				logging,
			});
		}
	}
}

export function isFunctionPerRouteEnabled(adapter: AstroAdapter | undefined): boolean {
	if (adapter?.adapterFeatures?.functionPerRoute === true) {
		return true;
	} else {
		return false;
	}
}

export function isEdgeMiddlewareEnabled(adapter: AstroAdapter | undefined): boolean {
	if (adapter?.adapterFeatures?.edgeMiddleware === true) {
		return true;
	} else {
		return false;
	}
}
