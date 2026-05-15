import { AstroLogger } from './core.js';
import { AstroError } from '../errors/index.js';
import { UnableToLoadLogger } from '../errors/errors-data.js';
import { default as nodeLoggerCreator, createNodeLoggerFromFlags } from './impls/node.js';
import { default as consoleLoggerCreator } from './impls/console.js';
import { default as jsonLoggerCreator } from './impls/json.js';
import { default as composeLoggerCreator } from './impls/compose.js';
async function loadLogger(config, level = 'info') {
	let cause = void 0;
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
				let destinations = [];
				if (config.config?.loggers) {
					const loggers = config.config?.loggers;
					destinations = await Promise.all(
						loggers.map(async (loggerConfig) => {
							const logger = await import(
								/* @vite-ignore */
								loggerConfig.entrypoint
							);
							return logger.default(loggerConfig.config);
						}),
					);
				}
				return new AstroLogger({
					destination: composeLoggerCreator(destinations),
					level,
				});
			}
			default: {
				const nodeLogger = await import(
					/* @vite-ignore */
					config.entrypoint
				);
				return new AstroLogger({
					destination: nodeLogger.default(config.config),
					level,
				});
			}
		}
	} catch (e) {
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
async function loadOrCreateNodeLogger(astroConfig, inlineAstroConfig) {
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
export { loadLogger, loadOrCreateNodeLogger };
