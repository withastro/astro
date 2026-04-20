import { AstroError } from '../errors/errors.js';
import { LoggerConfigurationNotSerializable } from '../errors/errors-data.js';
import type { LoggerHandlerConfig } from './config.js';

export const LOGGER_MODULE_ID = 'virtual:astro:logger';
export const RESOLVED_LOGGER_MODULE_ID = '\0' + LOGGER_MODULE_ID;

/**
 * Generates virtual module code for a logger factory given a `LoggerHandlerConfig`.
 * Handles built-in loggers (node, console, json), the compose meta-logger,
 * and arbitrary user-provided entrypoints.
 */
export function generateLoggerCode(config: LoggerHandlerConfig): string {
	switch (config.entrypoint) {
		case 'astro/logger/node':
		case 'astro/logger/console':
		case 'astro/logger/json': {
			return createSimpleLoggerCode(config.entrypoint, config.config);
		}
		case 'astro/logger/compose': {
			return createComposeCode(config.config?.loggers);
		}
		default: {
			return createSimpleLoggerCode(config.entrypoint, config.config);
		}
	}
}

function createSimpleLoggerCode(factory: string, config: Record<string, unknown> = {}): string {
	try {
		const serializedConfig = JSON.stringify(config, null, 2);
		return `import { default as factory } from '${factory}';\nexport default factory(${serializedConfig});\n`;
	} catch {
		throw new AstroError(LoggerConfigurationNotSerializable);
	}
}

function createComposeCode(loggers: LoggerHandlerConfig[]): string {
	try {
		const imports = loggers
			.map((logger, i) => `import factory${i} from '${logger.entrypoint}';`)
			.join('\n');
		const args = loggers
			.map((logger, i) => {
				const serializedConfig = JSON.stringify(logger.config ?? {});
				return `factory${i}(${serializedConfig})`;
			})
			.join(', ');
		return [
			imports,
			`import { compose } from 'astro/logger/compose';`,
			`export default compose(${args});`,
		].join('\n');
	} catch {
		throw new AstroError(LoggerConfigurationNotSerializable);
	}
}
