import type { AstroInlineConfig } from '../../@types/astro.js';
import type { LogOptions } from '../logger/core.js';
import { nodeLogDestination } from '../logger/node.js';

export function createNodeLogging(inlineConfig: AstroInlineConfig): LogOptions {
	// For internal testing, the inline config can pass the raw `logging` object directly
	if (inlineConfig.logging) return inlineConfig.logging;

	return {
		dest: nodeLogDestination,
		level: inlineConfig.logLevel ?? 'info',
	};
}
