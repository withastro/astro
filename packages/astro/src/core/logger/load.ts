import { AstroLogger, type AstroLoggerDestination } from './core.js';
import { AstroError } from '../errors/index.js';
import { UnableToLoadLogger } from '../errors/errors-data.js';
import type { LoggerHandlerConfig } from './config.js';
import type { AstroConfig, AstroInlineConfig } from '../../types/public/index.js';
import { default as nodeLoggerCreator, createNodeLoggerFromFlags } from './impls/node.js';
import { default as consoleLoggerCreator } from './impls/console.js';
import { default as jsonLoggerCreator } from './impls/json.js';
import { default as composeLoggerCreator } from './impls/compose.js';

function normalizeEntrypoint(entrypoint: LoggerHandlerConfig['entrypoint']): string {
	return entrypoint instanceof URL ? entrypoint.href : entrypoint;
}

export async function loadLoggerDestination(
	config: LoggerHandlerConfig,
): Promise<AstroLoggerDestination> {
	let cause: Error | undefined = undefined;
	const entrypoint = normalizeEntrypoint(config.entrypoint);

	try {
		switch (config.entrypoint) {
			case 'astro/logger/node': {
				return nodeLoggerCreator(config.config);
			}
			case 'astro/logger/console': {
				return consoleLoggerCreator(config.config);
			}
			case 'astro/logger/json': {
				return jsonLoggerCreator(config.config);
			}
			case 'astro/logger/compose': {
				let destinations: AstroLoggerDestination[] = [];
				if (config.config?.loggers) {
					const loggers: LoggerHandlerConfig[] = config.config?.loggers;
					destinations = await Promise.all(
						loggers.map(async (loggerConfig) => {
							const logger = await import(
								/* @vite-ignore */ normalizeEntrypoint(loggerConfig.entrypoint)
							);
							return logger.default(loggerConfig.config) as AstroLoggerDestination;
						}),
					);
				}

				return composeLoggerCreator(destinations);
			}
			default: {
				const logger = await import(/* @vite-ignore */ entrypoint);
				return logger.default(config.config);
			}
		}
	} catch (e: unknown) {
		if (e instanceof Error) {
			cause = e;
		}
	}

	const error = new AstroError({
		...UnableToLoadLogger,
		message: UnableToLoadLogger.message(entrypoint),
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
): Promise<AstroLogger> {
	// Internal testing shortcut: if a pre-built AstroLogger instance was
	// passed via the internal `_logger` property, use it directly.
	if (inlineAstroConfig._logger) return inlineAstroConfig._logger;

	try {
		if (astroConfig.logger) {
			return new AstroLogger({
				destination: await loadLoggerDestination(astroConfig.logger),
				level: inlineAstroConfig.logLevel ?? 'info',
			});
		} else {
			return createNodeLoggerFromFlags(inlineAstroConfig);
		}
	} catch {
		return createNodeLoggerFromFlags(inlineAstroConfig);
	}
}
