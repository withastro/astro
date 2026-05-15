import type { UserConfig as ViteUserConfig, UserConfigFn as ViteUserConfigFn } from 'vite';
import type { FontProvider } from '../assets/fonts/types.js';
import type { SessionDriverConfig, SessionDriverName } from '../core/session/types.js';
import type { AstroInlineConfig, AstroUserConfig, Locales } from '../types/public/config.js';
/**
 * See the full Astro Configuration API Documentation
 * https://astro.build/config
 */
export declare function defineConfig<
	const TLocales extends Locales = never,
	const TDriver extends SessionDriverName | SessionDriverConfig = never,
	const TFontProviders extends Array<FontProvider> = never,
>(
	config: AstroUserConfig<TLocales, TDriver, TFontProviders>,
): AstroUserConfig<TLocales, TDriver, TFontProviders>;
/**
 * Use Astro to generate a fully resolved Vite config
 */
export declare function getViteConfig(
	userViteConfig: ViteUserConfig,
	inlineAstroConfig?: AstroInlineConfig,
): ViteUserConfigFn;
