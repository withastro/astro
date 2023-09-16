import type { UserConfig } from 'vite';
import type { AstroUserConfig } from '../@types/astro.js';
import { Logger } from '../core/logger/core.js';

export function defineConfig(config: AstroUserConfig) {
	return config;
}

export function getViteConfig(inlineConfig: UserConfig) {
	// Return an async Vite config getter which exposes a resolved `mode` and `command`
	return async ({ mode, command }: { mode: string; command: 'serve' | 'build' }) => {
		// Vite `command` is `serve | build`, but Astro uses `dev | build`
		const cmd = command === 'serve' ? 'dev' : command;

		// Use dynamic import to avoid pulling in deps unless used
		const [
			fs,
			{ mergeConfig },
			{ nodeLogDestination },
			{ resolveConfig, createSettings },
			{ createVite },
			{ runHookConfigSetup, runHookConfigDone },
			{ astroContentListenPlugin },
		] = await Promise.all([
			import('node:fs'),
			import('vite'),
			import('../core/logger/node.js'),
			import('../core/config/index.js'),
			import('../core/create-vite.js'),
			import('../integrations/index.js'),
			import('./vite-plugin-content-listen.js'),
		]);
		const logger = new Logger({
			dest: nodeLogDestination,
			level: 'info',
		});
		const { astroConfig: config } = await resolveConfig({}, cmd);
		const settings = createSettings(config, inlineConfig.root);
		await runHookConfigSetup({ settings, command: cmd, logger });
		const viteConfig = await createVite(
			{
				mode,
				plugins: [
					// Initialize the content listener
					astroContentListenPlugin({ settings, logger, fs }),
				],
			},
			{ settings, logger, mode }
		);
		await runHookConfigDone({ settings, logger });
		return mergeConfig(viteConfig, inlineConfig);
	};
}
