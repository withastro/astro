import type { AstroSettings } from '../../types/astro.js';
import type { AstroConfig, AstroInlineConfig } from '../../types/public/config.js';
export declare function createBaseSettings(
	config: AstroConfig,
	logLevel: AstroInlineConfig['logLevel'],
): AstroSettings;
export declare function createSettings(
	config: AstroConfig,
	logLevel: AstroInlineConfig['logLevel'],
	cwd?: string,
): Promise<AstroSettings>;
