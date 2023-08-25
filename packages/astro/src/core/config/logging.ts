import type { AstroInlineConfig } from '../../@types/astro.js';
import { Logger } from '../logger/core.js';
import { nodeLogDestination } from '../logger/node.js';

export function createNodeLogger(inlineConfig: AstroInlineConfig): Logger {
	if (inlineConfig.logging) return new Logger(inlineConfig.logging);

	return new Logger({
		dest: nodeLogDestination,
		level: inlineConfig.logLevel ?? 'info',
	});
}
