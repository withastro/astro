import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';
import type { LogLevel, Rollup, Logger as ViteLogger, Plugin } from 'vite';
import { AstroError, isAstroError } from '../errors/errors.js';
import { serverShortcuts as formatServerShortcuts } from '../messages/runtime.js';
import { type AstroLogger as AstroLogger, isLogLevelEnabled } from './core.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
import type { LoggerHandlerConfig } from './config.js';
import { LoggerConfigurationNotSerializable } from '../errors/errors-data.js';

const PKG_PREFIX = fileURLToPath(new URL('../../../', import.meta.url));
const E2E_PREFIX = fileURLToPath(new URL('../../../e2e', import.meta.url));
function isAstroSrcFile(id: string | null) {
	return id?.startsWith(PKG_PREFIX) && !id.startsWith(E2E_PREFIX);
}

// capture "page reload some/Component.vue (additional info)" messages
const vitePageReloadMsg = /page reload (.*)/;
// capture "hmr update some/Component.vue" messages
const viteHmrUpdateMsg = /hmr update (.*)/;
// capture "vite v5.0.0 building SSR bundle for production..." and "vite v5.0.0 building for production..." messages
const viteBuildMsg = /vite.*building.*for production/;
// capture "\n  Shortcuts" messages
const viteShortcutTitleMsg = /^\s*Shortcuts\s*$/;
// capture "press * + enter to ..." messages
const viteShortcutHelpMsg = /press (.+?) to (.+)$/s;
// 'global' is not recognized as a valid pseudo-class
const lightningcssUnsupportedPseudoMsg = /\[lightningcss\] 'global'.*not recognized.*pseudo-class/s;

export function createViteLogger(
	astroLogger: AstroLogger,
	viteLogLevel: LogLevel = 'info',
): ViteLogger {
	const warnedMessages = new Set<string>();
	const loggedErrors = new WeakSet<Error | Rollup.RollupError>();

	const logger: ViteLogger = {
		hasWarned: false,
		info(msg) {
			if (!isLogLevelEnabled(viteLogLevel, 'info')) return;

			const stripped = stripVTControlCharacters(msg);
			let m;
			// Rewrite HMR page reload message
			if ((m = vitePageReloadMsg.exec(stripped))) {
				if (isAstroSrcFile(m[1])) return;
				astroLogger.info('watch', m[1]);
			}
			// Rewrite HMR update message
			else if ((m = viteHmrUpdateMsg.exec(stripped))) {
				if (isAstroSrcFile(m[1])) return;
				astroLogger.info('watch', m[1]);
			}
			// Don't log Vite build messages and shortcut titles
			else if (viteBuildMsg.test(stripped) || viteShortcutTitleMsg.test(stripped)) {
				// noop
			}
			// Log shortcuts help messages without indent
			else if (viteShortcutHelpMsg.test(stripped)) {
				const [, key, label] = viteShortcutHelpMsg.exec(stripped)! as string[];
				astroLogger.info('SKIP_FORMAT', formatServerShortcuts({ key, label }));
			}
			// Fallback
			else {
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

const LOGGER_MODULE_ID = 'virtual:astro:logger';
const RESOLVED_LOGGER_MODULE_ID = '\0' + LOGGER_MODULE_ID;

type Options = {
	config: LoggerHandlerConfig;
};

export function astroLoggerVitePlugin({ config }: Options): Plugin {
	return {
		name: LOGGER_MODULE_ID,
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.astro ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},
		resolveId: {
			filter: {
				id: new RegExp(`^${LOGGER_MODULE_ID}$`),
			},
			handler() {
				return RESOLVED_LOGGER_MODULE_ID;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_LOGGER_MODULE_ID}$`),
			},
			async handler() {
				switch (config.entrypoint) {
					case 'astro/logger/node':
					case 'astro/logger/console':
					case 'astro/logger/json': {
						return {
							code: createLoggerCode(config.entrypoint, config.config),
						};
					}
					case 'astro/logger/compose': {
						return {
							code: createComposeCode(config.config?.loggers),
						};
					}
					default: {
						return {
							code: createLoggerCode('astro/logger/node', config.config),
						};
					}
				}
			},
		},
	};
}

function createLoggerCode(factory: string, config: Record<string, unknown> = {}) {
	try {
		const serializedConfig = JSON.stringify(config, null, 2);
		return `import { default as factory } from '${factory}';
	export default factory(${serializedConfig});
	`;
	} catch {
		throw new AstroError(LoggerConfigurationNotSerializable);
	}
}

function createComposeCode(loggers: LoggerHandlerConfig[]): string {
	try {
		const imports = loggers
			.map((logger, i) => `import factory${i} from '${logger.entrypoint}';`)
			.join('\n');
		const args = loggers
			.map((logger, i) => {
				const serializedConfig = JSON.stringify(logger.config ?? {});
				return `factory${i}(${serializedConfig})`;
			})
			.join(', ');
		return [
			imports,
			`import { compose } from 'astro/logger/compose';`,
			`export default compose(${args});`,
		].join('\n');
	} catch {
		throw new AstroError(LoggerConfigurationNotSerializable);
	}
}
