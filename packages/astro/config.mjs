export function defineConfig(config) {
	return config;
}

export async function getViteConfig(inlineConfig) {
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
		cmd: 'dev',
		logging,
	});
	await runHookConfigSetup({ config, command: 'dev' });
	const viteConfig = await createVite(
		{
			mode: 'dev',
		},
		{ astroConfig: config, logging: logging, mode: 'dev' }
	);
	await runHookConfigDone({ config });
	return mergeConfig(viteConfig, inlineConfig);
}
