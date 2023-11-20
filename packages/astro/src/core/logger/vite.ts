import type { Logger as ViteLogger, Rollup } from 'vite';
import type { Logger as AstroLogger } from './core.js';

export function createViteLogger(astroLogger: AstroLogger): ViteLogger {
	const warnedMessages = new Set<string>();
	const loggedErrors = new WeakSet<Error | Rollup.RollupError>();

	const logger: ViteLogger = {
		hasWarned: false,

		info(msg) {
			astroLogger.info('vite', msg);
		},
		warn(msg) {
			logger.hasWarned = true;
			astroLogger.warn('vite', msg);
		},
		warnOnce(msg) {
			if (warnedMessages.has(msg)) return;
			logger.hasWarned = true;
			astroLogger.warn('vite', msg);
			warnedMessages.add(msg);
		},
		error(msg, opts) {
			logger.hasWarned = true;
			astroLogger.error('vite', msg);
			if (opts?.error) {
				loggedErrors.add(opts.error);
			}
		},
		// Don't allow clear screen
		clearScreen: () => {},
		hasErrorLogged(error) {
			return loggedErrors.has(error);
		},
	};

	return logger;
}
