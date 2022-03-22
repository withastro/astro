import type { AddressInfo } from 'net';
import type { ViteDevServer } from 'vite';
import { AstroConfig, AstroIntegration, AstroRenderer, BuildConfig } from '../@types/astro.js';
import { mergeConfig } from '../core/config.js';
import ssgAdapter from '../adapter-ssg/index.js';

export async function runHookConfigSetup({ config: _config, command }: { config: AstroConfig; command: 'dev' | 'build' }): Promise<AstroConfig> {
	let updatedConfig: AstroConfig = { ..._config };
	for (const integration of _config.integrations) {
		if (integration.hooks['astro:config:setup']) {
			await callConfigSetup(integration, updatedConfig, command);
		}
	}
	// Call the default adapter
	if(!updatedConfig._ctx.adapter) {
		const integration = ssgAdapter();
		updatedConfig.integrations.push(integration);
		if(integration.hooks['astro:config:setup']) {
			await callConfigSetup(integration, updatedConfig, command);
		}
	}
	return updatedConfig;
}

export async function callConfigSetup(integration: AstroIntegration, updatedConfig: AstroConfig, command: 'dev' | 'build') {
	if(integration.hooks['astro:config:setup']) {
		await integration.hooks['astro:config:setup']({
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
		});
	}
}

export async function runHookConfigDone({ config }: { config: AstroConfig }) {
	for (const integration of config.integrations) {
		if (integration.hooks['astro:config:done']) {
			await integration.hooks['astro:config:done']({
				config,
				setAdapter(adapter) {
					config._ctx.adapter = adapter;
				}
			});
		}
	}
}

export async function runHookServerSetup({ config, server }: { config: AstroConfig; server: ViteDevServer }) {
	for (const integration of config.integrations) {
		if (integration.hooks['astro:server:setup']) {
			await integration.hooks['astro:server:setup']({ server });
		}
	}
}

export async function runHookServerStart({ config, address }: { config: AstroConfig; address: AddressInfo }) {
	for (const integration of config.integrations) {
		if (integration.hooks['astro:server:start']) {
			await integration.hooks['astro:server:start']({ address });
		}
	}
}

export async function runHookServerDone({ config }: { config: AstroConfig }) {
	for (const integration of config.integrations) {
		if (integration.hooks['astro:server:done']) {
			await integration.hooks['astro:server:done']();
		}
	}
}

export async function runHookBuildStart({ config, buildConfig }: { config: AstroConfig, buildConfig: BuildConfig }) {
	for (const integration of config.integrations) {
		if (integration.hooks['astro:build:start']) {
			await integration.hooks['astro:build:start']({ buildConfig });
		}
	}
}

export async function runHookBuildDone({ config, pages }: { config: AstroConfig; pages: string[] }) {
	for (const integration of config.integrations) {
		if (integration.hooks['astro:build:done']) {
			await integration.hooks['astro:build:done']({ pages: pages.map((p) => ({ pathname: p })), dir: config.dist });
		}
	}
}
