import type { UserConfig as ViteUserConfig } from 'vite';
import type { AstroInlineConfig, AstroUserConfig } from '../@types/astro.js';

export function defineConfig(config: AstroUserConfig) {
	return config;
}

export function getViteConfig(
	userViteConfig: ViteUserConfig,
	inlineAstroConfig: AstroInlineConfig = {},
) {
	// Return an async Vite config getter which exposes a resolved `mode` and `command`
	return async ({ mode, command }: { mode: string; command: 'serve' | 'build' }) => {
		// Vite `command` is `serve | build`, but Astro uses `dev | build`
		const cmd = command === 'serve' ? 'dev' : command;

		// Use dynamic import to avoid pulling in deps unless used
		const [
			fs,
			{ mergeConfig },
			{ createNodeLogger },
			{ resolveConfig, createSettings },
			{ createVite },
			{ runHookConfigSetup, runHookConfigDone },
			{ astroContentListenPlugin },
		] = await Promise.all([
			import('node:fs'),
			import('vite'),
			import('../core/config/logging.js'),
			import('../core/config/index.js'),
			import('../core/create-vite.js'),
			import('../integrations/hooks.js'),
			import('./vite-plugin-content-listen.js'),
		]);
		const logger = createNodeLogger(inlineAstroConfig);
		const { astroConfig: config } = await resolveConfig(inlineAstroConfig, cmd);
		let settings = await createSettings(config, userViteConfig.root);
		settings = await runHookConfigSetup({ settings, command: cmd, logger });
		const viteConfig = await createVite(
			{
				mode,
				plugins: [
					// Initialize the content listener
					astroContentListenPlugin({ settings, logger, fs }),
				],
			},
			{ settings, logger, mode, sync: false },
		);
		await runHookConfigDone({ settings, logger });
		return mergeConfig(viteConfig, userViteConfig);
	};
}
