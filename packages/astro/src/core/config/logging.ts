import type { AstroInlineConfig } from '../../types/public/config.js';
import { consoleLogDestination } from '../logger/console.js';
import { Logger } from '../logger/core.js';
import { nodeLogDestination } from '../logger/node.js';

export function createNodeLogger(inlineConfig: AstroInlineConfig): Logger {
	if (inlineConfig.logger) return inlineConfig.logger;

	return new Logger({
		dest: nodeLogDestination,
		level: inlineConfig.logLevel ?? 'info',
	});
}

export function createConsoleLogger(level: AstroInlineConfig['logLevel']): Logger {
	return new Logger({
		dest: consoleLogDestination,
		level: level ?? 'info',
	});
}
