import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';
import type { LogLevel, Rollup, Logger as ViteLogger } from 'vite';
import { isAstroError } from '../errors/errors.js';
import { serverShortcuts as formatServerShortcuts } from '../messages.js';
import { type Logger as AstroLogger, isLogLevelEnabled } from './core.js';

/**
 * Path constants for identifying Astro source files
 * These are used to filter out internal Astro HMR updates from user-facing logs
 */
const PKG_PREFIX = fileURLToPath(new URL('../../../', import.meta.url));
const E2E_PREFIX = fileURLToPath(new URL('../../../e2e', import.meta.url));

/**
 * Determines if a file path is part of Astro's internal source code
 * @param id - The file path to check
 * @returns true if the file is an Astro source file (excluding e2e tests)
 */
function isAstroSrcFile(id: string | null): boolean {
	return !!id && id.startsWith(PKG_PREFIX) && !id.startsWith(E2E_PREFIX);
}

/**
 * Regular expressions for parsing and filtering Vite log messages
 * These patterns help transform Vite's output into Astro-specific log formats
 */
const VITE_LOG_PATTERNS = {
	/** Matches: "page reload some/Component.vue (additional info)" */
	pageReload: /page reload (.*)/,
	/** Matches: "hmr update some/Component.vue" */
	hmrUpdate: /hmr update (.*)/,
	/** Matches: "vite v5.0.0 building SSR bundle for production..." and similar build messages */
	buildMessage: /vite.*building.*for production/,
	/** Matches: "\n  Shortcuts" (the shortcuts section title) */
	shortcutTitle: /^\s*Shortcuts\s*$/,
	/** Matches: "press h + enter to show help" and similar shortcut help messages */
	shortcutHelp: /press (.+?) to (.+)$/s,
} as const;

/**
 * Regular expressions for filtering out known non-critical warnings
 */
const FILTERED_WARNINGS = {
	/** LightningCSS warning about :global() pseudo-class - this is expected and safe to ignore */
	lightningcssGlobalPseudo: /\[lightningcss\] 'global'.*not recognized.*pseudo-class/s,
} as const;

/**
 * Error message patterns that should be handled specially
 * These errors are already logged by Astro's error handling system
 */
const SSR_ERROR_PATTERNS = {
	sseEvaluation: 'Error when evaluating SSR module',
	preTransform: 'Pre-transform error:',
} as const;

/**
 * Helper type for regex match results with captured groups
 */
type RegexMatch = RegExpExecArray;

/**
 * Checks if a message should be filtered out based on known patterns
 * @param message - The message to check
 * @returns true if the message should be filtered out
 */
function shouldFilterWarning(message: string): boolean {
	return FILTERED_WARNINGS.lightningcssGlobalPseudo.test(message);
}

/**
 * Checks if an error message is a known SSR error that's handled elsewhere
 * @param message - The error message to check
 * @returns true if this is a handled SSR error
 */
function isHandledSsrError(message: string): boolean {
	return (
		message.includes(SSR_ERROR_PATTERNS.sseEvaluation) ||
		message.includes(SSR_ERROR_PATTERNS.preTransform)
	);
}

/**
 * Processes Vite info messages and transforms them into Astro-specific log messages
 * @param msg - The raw Vite message
 * @param astroLogger - The Astro logger instance
 */
function handleInfoMessage(msg: string, astroLogger: AstroLogger): void {
	const stripped = stripVTControlCharacters(msg);
	let match: RegexMatch | null;

	// Handle HMR page reload messages
	if ((match = VITE_LOG_PATTERNS.pageReload.exec(stripped))) {
		const [, filePath] = match;
		// Skip logging for internal Astro source file updates
		if (isAstroSrcFile(filePath)) return;
		astroLogger.info('watch', filePath);
		return;
	}

	// Handle HMR update messages
	if ((match = VITE_LOG_PATTERNS.hmrUpdate.exec(stripped))) {
		const [, filePath] = match;
		// Skip logging for internal Astro source file updates
		if (isAstroSrcFile(filePath)) return;
		astroLogger.info('watch', filePath);
		return;
	}

	// Filter out Vite build messages and shortcut section titles
	if (
		VITE_LOG_PATTERNS.buildMessage.test(stripped) ||
		VITE_LOG_PATTERNS.shortcutTitle.test(stripped)
	) {
		return;
	}

	// Handle keyboard shortcut help messages
	if ((match = VITE_LOG_PATTERNS.shortcutHelp.exec(stripped))) {
		const [, key, label] = match;
		astroLogger.info('SKIP_FORMAT', formatServerShortcuts({ key, label }));
		return;
	}

	// Default: log the message as-is with 'vite' label
	astroLogger.info('vite', msg);
}

/**
 * Creates a custom Vite logger that integrates with Astro's logging system
 * 
 * This logger intercepts Vite's log messages and transforms them into Astro-specific
 * formats, filters out redundant messages, and ensures proper log level handling.
 * 
 * @param astroLogger - The Astro logger instance to use for output
 * @param viteLogLevel - The log level for Vite messages (defaults to 'info')
 * @returns A Vite-compatible logger instance
 */
export function createViteLogger(
	astroLogger: AstroLogger,
	viteLogLevel: LogLevel = 'info',
): ViteLogger {
	// Track messages that have already been warned once
	const warnedMessages = new Set<string>();
	// Track errors that have already been logged to prevent duplicates
	const loggedErrors = new WeakSet<Error | Rollup.RollupError>();

	const logger: ViteLogger = {
		hasWarned: false,

		info(msg: string): void {
			if (!isLogLevelEnabled(viteLogLevel, 'info')) return;
			handleInfoMessage(msg, astroLogger);
		},

		warn(msg: string): void {
			if (!isLogLevelEnabled(viteLogLevel, 'warn')) return;

			// Filter out known non-critical warnings
			if (shouldFilterWarning(msg)) return;

			logger.hasWarned = true;
			astroLogger.warn('vite', msg);
		},

		warnOnce(msg: string): void {
			if (!isLogLevelEnabled(viteLogLevel, 'warn')) return;

			// Skip if this exact message has already been warned
			if (warnedMessages.has(msg)) return;

			// Filter out known non-critical warnings
			if (shouldFilterWarning(msg)) return;

			logger.hasWarned = true;
			astroLogger.warn('vite', msg);
			warnedMessages.add(msg);
		},

		error(msg: string, opts?: { error?: Error | Rollup.RollupError }): void {
			if (!isLogLevelEnabled(viteLogLevel, 'error')) return;

			logger.hasWarned = true;

			const err = opts?.error;
			
			// Track this error to prevent duplicate logging
			if (err) loggedErrors.add(err);

			// Skip Astro errors - they're already logged by Astro's error handler
			if (err && isAstroError(err)) return;

			// SSR module and pre-transform errors are handled by Astro's error system
			// Send these to debug logs instead of error logs to avoid duplicate output
			if (isHandledSsrError(msg)) {
				astroLogger.debug('vite', msg);
				return;
			}

			astroLogger.error('vite', msg);
		},

		/**
		 * Prevent Vite from clearing the screen
		 * We want to maintain the full log history in the terminal
		 */
		clearScreen(): void {
			// Intentionally empty - we don't want Vite to clear the screen
		},

		/**
		 * Check if an error has already been logged
		 * @param error - The error to check
		 * @returns true if the error has been logged
		 */
		hasErrorLogged(error: Error | Rollup.RollupError): boolean {
			return loggedErrors.has(error);
		},
	};

	return logger;
}
