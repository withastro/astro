export function defineConfig(config) {
	return config;
}

export function getViteConfig(inlineConfig) {
	// Return an async Vite config getter which exposes a resolved `mode` and `command`
	return async ({ mode, command }) => {
		// Vite `command` is `serve | build`, but Astro uses `dev | build`
		const cmd = command === 'serve' ? 'dev' : command;

		// Use dynamic import to avoid pulling in deps unless used
		const [
			{ mergeConfig },
			{ nodeLogDestination },
			{ openConfig },
			{ createVite },
			{ runHookConfigSetup, runHookConfigDone },
		] = await Promise.all([
			import('vite'),
			import('./dist/core/logger/node.js'),
			import('./dist/core/config.js'),
			import('./dist/core/create-vite.js'),
			import('./dist/integrations/index.js'),
		]);
		const logging = {
			dest: nodeLogDestination,
			level: 'info',
		};
		const { astroConfig: config } = await openConfig({
			cmd,
			logging,
		});
		await runHookConfigSetup({ config, command: cmd });
		const viteConfig = await createVite(
			{
				mode,
			},
			{ astroConfig: config, logging: logging, mode }
		);
		await runHookConfigDone({ config });
		return mergeConfig(viteConfig, inlineConfig);
	};
}
