function defineConfig(config) {
	return config;
}
function getViteConfig(userViteConfig, inlineAstroConfig = {}) {
	return async ({ mode, command }) => {
		const cmd = command === 'serve' ? 'dev' : 'build';
		const [
			{ mergeConfig },
			{ loadOrCreateNodeLogger },
			{ resolveConfig, createSettings },
			{ createVite },
			{ runHookConfigSetup, runHookConfigDone },
			{ createRoutesList },
			{ getPrerenderDefault },
		] = await Promise.all([
			import('vite'),
			import('../core/logger/load.js'),
			import('../core/config/index.js'),
			import('../core/create-vite.js'),
			import('../integrations/hooks.js'),
			import('../core/routing/create-manifest.js'),
			import('../prerender/utils.js'),
		]);
		const { astroConfig: config } = await resolveConfig(inlineAstroConfig, cmd);
		const logger = await loadOrCreateNodeLogger(config, inlineAstroConfig);
		let settings = await createSettings(config, inlineAstroConfig.logLevel, userViteConfig.root);
		settings = await runHookConfigSetup({ settings, command: cmd, logger });
		const routesList = await createRoutesList(
			{
				settings,
			},
			logger,
			{ dev: true },
		);
		settings.buildOutput = getPrerenderDefault(settings.config) ? 'static' : 'server';
		const viteConfig = await createVite(
			{},
			{ routesList, settings, command: cmd, logger, mode, sync: false },
		);
		await runHookConfigDone({ settings, logger });
		return mergeConfig(viteConfig, userViteConfig);
	};
}
export { defineConfig, getViteConfig };
