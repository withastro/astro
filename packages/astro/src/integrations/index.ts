import { bold } from 'kleur/colors';
import type { AddressInfo } from 'net';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { InlineConfig, ViteDevServer } from 'vite';
import type {
	AstroConfig,
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
import { mergeConfig } from '../core/config/config.js';
import { info, type LogOptions } from '../core/logger/core.js';
import { isServerLikeOutput } from '../prerender/utils.js';

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
						settings.adapter = adapter;
					},
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
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:server:setup']({ server }),
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
		if (integration?.hooks?.['astro:server:start']) {
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:server:start']({ address }),
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
		if (integration?.hooks?.['astro:server:done']) {
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:server:done'](),
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
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:build:start'](),
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
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:build:setup']({
					vite,
					pages,
					target,
					updateConfig: (newConfig) => {
						updatedConfig = mergeConfig(updatedConfig, newConfig);
					},
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
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:build:ssr']({
					manifest,
					entryPoints,
					middlewareEntryPoint,
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
		if (integration?.hooks?.['astro:build:generated']) {
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:build:generated']({ dir }),
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
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:build:done']({
					pages: pages.map((p) => ({ pathname: p })),
					dir,
					routes,
				}),
				logging,
			});
		}
	}
}
