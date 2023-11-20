import { fileURLToPath } from 'url';
import stripAnsi from 'strip-ansi';
import type { Logger as ViteLogger, Rollup } from 'vite';
import type { Logger as AstroLogger } from './core.js';

const PKG_PREFIX = fileURLToPath(new URL('../../../', import.meta.url));
const E2E_PREFIX = fileURLToPath(new URL('../../../e2e', import.meta.url));
export function isAstroSrcFile(id: string | null) {
	return id?.startsWith(PKG_PREFIX) && !id.startsWith(E2E_PREFIX);
}

// capture "page reload some/Component.vue (additional info)" messages
const vitePageReloadMsg = /page reload (.*)( \(.*\))?/;
// capture "hmr update some/Component.vue" messages
const viteHmrUpdateMsg = /hmr update (.*)/;

export function createViteLogger(astroLogger: AstroLogger): ViteLogger {
	const warnedMessages = new Set<string>();
	const loggedErrors = new WeakSet<Error | Rollup.RollupError>();

	const logger: ViteLogger = {
		hasWarned: false,

		info(msg) {
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
			// Fallback
			else {
				astroLogger.info('vite', msg);
			}
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
