import type { UserConfig as ViteUserConfig, UserConfigFn as ViteUserConfigFn } from 'vite';
import type {
	AstroInlineConfig,
	AstroUserConfig,
	Locales,
	SessionDriverName,
} from '../types/public/config.js';
import { createRoutesList } from '../core/routing/index.js';

/**
 * See the full Astro Configuration API Documentation
 * https://astro.build/config
 */
export function defineConfig<
	const TLocales extends Locales = never,
	const TDriver extends SessionDriverName = never,
>(config: AstroUserConfig<TLocales, TDriver>) {
	return config;
}

/**
 * Use Astro to generate a fully resolved Vite config
 */
export function getViteConfig(
	userViteConfig: ViteUserConfig,
	inlineAstroConfig: AstroInlineConfig = {},
): ViteUserConfigFn {
	// Return an async Vite config getter which exposes a resolved `mode` and `command`
	return async ({ mode, command }) => {
		// Vite `command` is `serve | build`, but Astro uses `dev | build`
		const cmd = command === 'serve' ? 'dev' : 'build';

		// Use dynamic import to avoid pulling in deps unless used
		const [
			{ mergeConfig },
			{ createNodeLogger },
			{ resolveConfig, createSettings },
			{ createVite },
			{ runHookConfigSetup, runHookConfigDone },
		] = await Promise.all([
			import('vite'),
			import('../core/config/logging.js'),
			import('../core/config/index.js'),
			import('../core/create-vite.js'),
			import('../integrations/hooks.js'),
		]);
		const logger = createNodeLogger(inlineAstroConfig);
		const { astroConfig: config } = await resolveConfig(inlineAstroConfig, cmd);
		let settings = await createSettings(config, userViteConfig.root);
		settings = await runHookConfigSetup({ settings, command: cmd, logger });
		const routesList = await createRoutesList(
			{
				settings,
			},
			logger,
			{ dev: true, skipBuildOutputAssignment: false },
		);
		const viteConfig = await createVite({}, { routesList, settings, command: cmd, logger, mode, sync: false });
		await runHookConfigDone({ settings, logger });
		return mergeConfig(viteConfig, userViteConfig);
	};
}
