import { AstroLogger, type AstroLoggerLevel } from './core.js';
import type { LoggerHandlerConfig } from './config.js';
import type { AstroConfig, AstroInlineConfig } from '../../types/public/index.js';
export declare function loadLogger(
	config: LoggerHandlerConfig,
	level?: AstroLoggerLevel,
): Promise<AstroLogger>;
/**
 * It attempts to load a logger from the entrypoint.
 * If not provided, it creates a new logger instance on the fly.
 * @param astroConfig
 * @param inlineAstroConfig
 */
export declare function loadOrCreateNodeLogger(
	astroConfig: AstroConfig,
	inlineAstroConfig: AstroInlineConfig,
): Promise<AstroLogger>;
