import { bold } from 'kleur/colors';
import type { AddressInfo } from 'net';
import type { ViteDevServer } from 'vite';
import {
	AstroConfig,
	AstroRenderer,
	BuildConfig,
	HookParameters,
	RouteData,
} from '../@types/astro.js';
import type { SerializedSSRManifest } from '../core/app/types';
import type { PageBuildData } from '../core/build/types';
import { mergeConfig } from '../core/config.js';
import type { ViteConfigWithSSR } from '../core/create-vite.js';
import { info, LogOptions } from '../core/logger/core.js';

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
	config: _config,
	command,
	logging,
}: {
	config: AstroConfig;
	command: 'dev' | 'build';
	logging: LogOptions;
}): Promise<AstroConfig> {
	// An adapter is an integration, so if one is provided push it.
	if (_config.adapter) {
		_config.integrations.push(_config.adapter);
	}

	let updatedConfig: AstroConfig = { ..._config };
	for (const integration of _config.integrations) {
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
		if (integration?.hooks?.['astro:config:setup']) {
			const hooks: HookParameters<'astro:config:setup'> = {
				config: updatedConfig,
				command,
				addRenderer(renderer: AstroRenderer) {
					updatedConfig._ctx.renderers.push(renderer);
				},
				injectScript: (stage, content) => {
					updatedConfig._ctx.scripts.push({ stage, content });
				},
				updateConfig: (newConfig) => {
					updatedConfig = mergeConfig(updatedConfig, newConfig) as AstroConfig;
				},
				injectRoute: (injectRoute) => {
					updatedConfig._ctx.injectedRoutes.push(injectRoute);
				},
			};
			// Semi-private `addPageExtension` hook
			function addPageExtension(...input: (string | string[])[]) {
				const exts = (input.flat(Infinity) as string[]).map((ext) => `.${ext.replace(/^\./, '')}`);
				updatedConfig._ctx.pageExtensions.push(...exts);
			}
			Object.defineProperty(hooks, 'addPageExtension', {
				value: addPageExtension,
				writable: false,
				enumerable: false,
			});
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:config:setup'](hooks),
				logging,
			});
		}
	}
	return updatedConfig;
}

export async function runHookConfigDone({
	config,
	logging,
}: {
	config: AstroConfig;
	logging: LogOptions;
}) {
	for (const integration of config.integrations) {
		if (integration?.hooks?.['astro:config:done']) {
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:config:done']({
					config,
					setAdapter(adapter) {
						if (config._ctx.adapter && config._ctx.adapter.name !== adapter.name) {
							throw new Error(
								`Integration "${integration.name}" conflicts with "${config._ctx.adapter.name}". You can only configure one deployment integration.`
							);
						}
						config._ctx.adapter = adapter;
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
	buildConfig,
	logging,
}: {
	config: AstroConfig;
	buildConfig: BuildConfig;
	logging: LogOptions;
}) {
	for (const integration of config.integrations) {
		if (integration?.hooks?.['astro:build:start']) {
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:build:start']({ buildConfig }),
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
	vite: ViteConfigWithSSR;
	pages: Map<string, PageBuildData>;
	target: 'server' | 'client';
	logging: LogOptions;
}) {
	for (const integration of config.integrations) {
		if (integration?.hooks?.['astro:build:setup']) {
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:build:setup']({
					vite,
					pages,
					target,
					updateConfig: (newConfig) => {
						mergeConfig(vite, newConfig);
					},
				}),
				logging,
			});
		}
	}
}

export async function runHookBuildSsr({
	config,
	manifest,
	logging,
}: {
	config: AstroConfig;
	manifest: SerializedSSRManifest;
	logging: LogOptions;
}) {
	for (const integration of config.integrations) {
		if (integration?.hooks?.['astro:build:ssr']) {
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['astro:build:ssr']({ manifest }),
				logging,
			});
		}
	}
}

export async function runHookBuildDone({
	config,
	buildConfig,
	pages,
	routes,
	logging,
}: {
	config: AstroConfig;
	buildConfig: BuildConfig;
	pages: string[];
	routes: RouteData[];
	logging: LogOptions;
}) {
	const dir = config.output === 'server' ? buildConfig.client : config.outDir;

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
