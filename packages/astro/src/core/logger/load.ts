import { AstroLogger, type AstroLoggerDestination, type AstroLoggerLevel } from './core.js';
import { AstroError } from '../errors/index.js';
import { UnableToLoadLogger } from '../errors/errors-data.js';
import type { LoggerHandlerConfig } from './config.js';
import type { AstroConfig, AstroInlineConfig } from '../../types/public/index.js';
import { default as nodeLoggerCreator, createNodeLoggerFromFlags } from './impls/node.js';
import { default as consoleLoggerCreator } from './impls/console.js';
import { default as jsonLoggerCreator } from './impls/json.js';
import { default as composeLoggerCreator } from './impls/compose.js';

export async function loadLogger(
	config: LoggerHandlerConfig,
	level: AstroLoggerLevel = 'info',
): Promise<AstroLogger> {
	let cause: Error | undefined = undefined;

	try {
		switch (config.entrypoint) {
			case 'astro/logger/node': {
				return new AstroLogger({
					destination: nodeLoggerCreator(config.config),
					level,
				});
			}
			case 'astro/logger/console': {
				return new AstroLogger({
					destination: consoleLoggerCreator(config.config),
					level,
				});
			}
			case 'astro/logger/json': {
				return new AstroLogger({
					destination: jsonLoggerCreator(config.config),
					level,
				});
			}
			case 'astro/logger/compose': {
				let destinations: AstroLoggerDestination[] = [];
				if (config.config?.loggers) {
					const loggers: LoggerHandlerConfig[] = config.config?.loggers;
					destinations = await Promise.all(
						loggers.map(async (loggerConfig) => {
							const logger = await import(/* @vite-ignore */ loggerConfig.entrypoint);
							return logger.default(loggerConfig.config) as AstroLoggerDestination;
						}),
					);
				}

				return new AstroLogger({
					destination: composeLoggerCreator(destinations),
					level,
				});
			}
			default: {
				const nodeLogger = await import(/* @vite-ignore */ config.entrypoint);
				return new AstroLogger({
					destination: nodeLogger.default(config.config),
					level,
				});
			}
		}
	} catch (e: unknown) {
		if (e instanceof Error) {
			cause = e;
		}
	}

	const error = new AstroError({
		...UnableToLoadLogger,
		message: UnableToLoadLogger.message(config.entrypoint),
	});
	if (cause) {
		error.cause = cause;
	}
	throw error;
}

/**
 * It attempts to load a logger from the entrypoint.
 * If not provided, it creates a new logger instance on the fly.
 * @param astroConfig
 * @param inlineAstroConfig
 */
export async function loadOrCreateNodeLogger(
	astroConfig: AstroConfig,
	inlineAstroConfig: AstroInlineConfig,
) {
	try {
		if (astroConfig.experimental.logger) {
			return await loadLogger(astroConfig.experimental.logger, inlineAstroConfig.logLevel);
		} else {
			return createNodeLoggerFromFlags(inlineAstroConfig);
		}
	} catch {
		return createNodeLoggerFromFlags(inlineAstroConfig);
	}
}
