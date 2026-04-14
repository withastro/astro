import type { LoggerHandlerConfig } from './config.js';
import type { JonsHandlerConfig } from './impls/json.js';

export const logHandlers = {
	json(config?: JonsHandlerConfig): LoggerHandlerConfig {
		return {
			entrypoint: 'astro/logger/json',
			config,
		};
	},
	node(): LoggerHandlerConfig {
		return {
			entrypoint: 'astro/logger/node',
		};
	},
	console(): LoggerHandlerConfig {
		return {
			entrypoint: 'astro/logger/console',
		};
	},

	compose(...loggers: LoggerHandlerConfig[]): LoggerHandlerConfig {
		return {
			entrypoint: 'astro/logger/compose',
			config: {
				loggers,
			},
		};
	},
};
