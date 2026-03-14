import type { UserConfig as ViteUserConfig, UserConfigFn as ViteUserConfigFn } from 'vite';
import type { FontProvider } from '../assets/fonts/types.js';
import { createRoutesList } from '../core/routing/create-manifest.js';
import { getPrerenderDefault } from '../prerender/utils.js';
import type { SessionDriverConfig, SessionDriverName } from '../core/session/types.js';
import type { AstroInlineConfig, AstroUserConfig, Locales } from '../types/public/config.js';

/**
 * See the full Astro Configuration API Documentation
 * https://astro.build/config
 */
export function defineConfig<
	const TLocales extends Locales = never,
	const TDriver extends SessionDriverName | SessionDriverConfig = never,
	const TFontProviders extends Array<FontProvider> = never,
>(config: AstroUserConfig<TLocales, TDriver, TFontProviders>) {
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
			import('../core/logger/node.js'),
			import('../core/config/index.js'),
			import('../core/create-vite.js'),
			import('../integrations/hooks.js'),
		]);
		const logger = createNodeLogger(inlineAstroConfig);
		const { astroConfig: config } = await resolveConfig(inlineAstroConfig, cmd);
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
