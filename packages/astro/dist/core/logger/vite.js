import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';
import { isAstroError } from '../errors/errors.js';
import { serverShortcuts as formatServerShortcuts } from '../messages/runtime.js';
import { isLogLevelEnabled } from './core.js';
const PKG_PREFIX = fileURLToPath(new URL('../../../', import.meta.url));
const E2E_PREFIX = fileURLToPath(new URL('../../../e2e', import.meta.url));
function isAstroSrcFile(id) {
	return id?.startsWith(PKG_PREFIX) && !id.startsWith(E2E_PREFIX);
}
const vitePageReloadMsg = /page reload (.*)/;
const viteHmrUpdateMsg = /hmr update (.*)/;
const viteBuildMsg = /vite.*building.*for production/;
const viteShortcutTitleMsg = /^\s*Shortcuts\s*$/;
const viteShortcutHelpMsg = /press (.+?) to (.+)$/s;
const lightningcssUnsupportedPseudoMsg = /\[lightningcss\] 'global'.*not recognized.*pseudo-class/s;
function createViteLogger(astroLogger, viteLogLevel = 'info') {
	const warnedMessages = /* @__PURE__ */ new Set();
	const loggedErrors = /* @__PURE__ */ new WeakSet();
	const logger = {
		hasWarned: false,
		info(msg) {
			if (!isLogLevelEnabled(viteLogLevel, 'info')) return;
			const stripped = stripVTControlCharacters(msg);
			let m;
			if ((m = vitePageReloadMsg.exec(stripped))) {
				if (isAstroSrcFile(m[1])) return;
				astroLogger.info('watch', m[1]);
			} else if ((m = viteHmrUpdateMsg.exec(stripped))) {
				if (isAstroSrcFile(m[1])) return;
				astroLogger.info('watch', m[1]);
			} else if (viteBuildMsg.test(stripped) || viteShortcutTitleMsg.test(stripped)) {
			} else if (viteShortcutHelpMsg.test(stripped)) {
				const [, key, label] = viteShortcutHelpMsg.exec(stripped);
				astroLogger.info('SKIP_FORMAT', formatServerShortcuts({ key, label }));
			} else {
				astroLogger.info('vite', msg);
			}
		},
		warn(msg) {
			if (!isLogLevelEnabled(viteLogLevel, 'warn')) return;
			if (lightningcssUnsupportedPseudoMsg.test(msg)) return;
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
			if (err && isAstroError(err)) return;
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
export { createViteLogger };
