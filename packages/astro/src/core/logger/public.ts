import type { AstroLoggerDestination } from '../../types/public/logger.js';
import type { AstroLogger } from './core.js';

export function defineDestination<D>(fn: AstroLoggerDestination<D>) {
	return fn;
}

export function defineAstroLogger(fn: AstroLogger) {
	return fn;
}
