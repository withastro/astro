import type { Logger } from '../../../core/logger/core.js';
import type { FontLogger } from '../definitions.js';

export function createAstroFontLogger({ logger }: { logger: Logger }): FontLogger {
	return {
		log: (_type, message) => {
			if (_type === 'warn') {
				return logger.warn('assets', message);
			}
			_type satisfies never;
		},
	};
}
