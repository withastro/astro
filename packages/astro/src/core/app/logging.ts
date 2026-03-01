import type { AstroInlineConfig } from '../../types/public/index.js';
import { consoleLogDestination } from '../logger/console.js';
import { Logger } from '../logger/core.js';

export function createConsoleLogger(level: AstroInlineConfig['logLevel']): Logger {
	return new Logger({
		dest: consoleLogDestination,
		level: level ?? 'info',
	});
}
