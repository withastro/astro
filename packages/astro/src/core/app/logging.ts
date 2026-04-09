import type { AstroInlineConfig } from '../../types/public/index.js';
import { consoleLogDestination } from '../logger/console.js';
import { AstroLogger } from '../logger/core.js';

export function createConsoleLogger(level: AstroInlineConfig['logLevel']): AstroLogger {
	return new AstroLogger({
		destination: consoleLogDestination,
		level: level ?? 'info',
	});
}
