import { fileURLToPath } from 'url';
import stripAnsi from 'strip-ansi';
import type { Logger as ViteLogger, Rollup, LogLevel } from 'vite';
import { isAstroError } from '../errors/errors.js';
import { isLogLevelEnabled, type Logger as AstroLogger } from './core.js';

const PKG_PREFIX = fileURLToPath(new URL('../../../', import.meta.url));
const E2E_PREFIX = fileURLToPath(new URL('../../../e2e', import.meta.url));
export function isAstroSrcFile(id: string | null) {
	return id?.startsWith(PKG_PREFIX) && !id.startsWith(E2E_PREFIX);
}

// capture "page reload some/Component.vue (additional info)" messages
const vitePageReloadMsg = /page reload (.*)( \(.*\))?/;
// capture "hmr update some/Component.vue" messages
const viteHmrUpdateMsg = /hmr update (.*)/;
// capture "vite v5.0.0 building SSR bundle for production..." and "vite v5.0.0 building for production..." messages
const viteBuildMsg = /vite.*building.*for production/;

export function createViteLogger(
	astroLogger: AstroLogger,
	viteLogLevel: LogLevel = 'info'
): ViteLogger {
	const warnedMessages = new Set<string>();
	const loggedErrors = new WeakSet<Error | Rollup.RollupError>();

	const logger: ViteLogger = {
		hasWarned: false,
		info(msg) {
			if (!isLogLevelEnabled(viteLogLevel, 'info')) return;

			const stripped = stripAnsi(msg);
			let m;
			// Rewrite HMR page reload message
			if ((m = vitePageReloadMsg.exec(stripped))) {
				if (isAstroSrcFile(m[1])) return;
				const extra = m[2] ?? '';
				astroLogger.info('watch', m[1] + extra);
			}
			// Rewrite HMR update message
			else if ((m = viteHmrUpdateMsg.exec(stripped))) {
				if (isAstroSrcFile(m[1])) return;
				astroLogger.info('watch', m[1]);
			}
			// Don't log Vite build messages
			else if (viteBuildMsg.test(stripped)) {
				// noop
			}
			// Fallback
			else {
				astroLogger.info('vite', msg);
			}
		},
		warn(msg) {
			if (!isLogLevelEnabled(viteLogLevel, 'warn')) return;

			logger.hasWarned = true;
			astroLogger.warn('vite', msg);
		},
		warnOnce(msg) {
			if (!isLogLevelEnabled(viteLogLevel, 'warn')) return;

			if (warnedMessages.has(msg)) return;
			logger.hasWarned = true;
			astroLogger.warn('vite', msg);
			warnedMessages.add(msg);
		},
		error(msg, opts) {
			if (!isLogLevelEnabled(viteLogLevel, 'error')) return;

			logger.hasWarned = true;

			const err = opts?.error;
			if (err) loggedErrors.add(err);
			// Astro errors are already logged by us, skip logging
			if (err && isAstroError(err)) return;
			// SSR module and pre-transform errors are always handled by us,
			// send to debug logs
			if (
				msg.includes('Error when evaluating SSR module') ||
				msg.includes('Pre-transform error:')
			) {
				astroLogger.debug('vite', msg);
				return;
			}

			astroLogger.error('vite', msg);
		},
		// Don't allow clear screen
		clearScreen: () => {},
		hasErrorLogged(error) {
			return loggedErrors.has(error);
		},
	};

	return logger;
}
