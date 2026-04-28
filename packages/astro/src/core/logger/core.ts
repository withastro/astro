import colors from 'piccolore';

export interface AstroLoggerDestination<T = unknown> {
	/**
	 * It receives a message and writes it into a destination
	 */
	write: (chunk: T) => void;
	/**
	 * It dumps logs without closing the connection to the destination.
	 * Method that can be used by specialized loggers.
	 */
	flush?: () => Promise<void> | void;
	/**
	 * It dumps logs and closes the connection to the destination.
	 * Method that can be used by specialized loggers.
	 */
	close?: () => Promise<void> | void;
}

// NOTE: this is a public type
/**
 * The level of logging. Priority is the following:
 * 1. debug
 * 2. error
 * 3. warn
 * 4. info
 * 5. silent
 */
export type AstroLoggerLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'; // same as Pino

/**
 * Defined logger labels. Add more as needed, but keep them high-level & reusable,
 * rather than specific to a single command, function, use, etc. The label will be
 * shown in the log message to the user, so it should be relevant.
 */
const AstroLoggerLabels = [
	'add',
	'build',
	'check',
	'config',
	'content',
	'crypto',
	'deprecated',
	'markdown',
	'router',
	'types',
	'vite',
	'watch',
	'middleware',
	'preferences',
	'redirects',
	'sync',
	'session',
	'toolbar',
	'assets',
	'env',
	'update',
	'adapter',
	'islands',
	'cache',
	'csp',
	// SKIP_FORMAT: A special label that tells the logger not to apply any formatting.
	// Useful for messages that are already formatted, like the server start message.
	'SKIP_FORMAT',
] as const;
type AstroLoggerLabel = (typeof AstroLoggerLabels)[number];

export interface AstroLogOptions {
	destination: AstroLoggerDestination<AstroLoggerMessage>;
	level: AstroLoggerLevel;

	/**
	 * Optional configuration for the logger destination
	 */
	config?: Record<string, any> | undefined;
}

// Hey, locales are pretty complicated! Be careful modifying this logic...
// If we throw at the top-level, international users can't use Astro.
//
// Using `[]` sets the default locale properly from the system!
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters
//
// Here be the dragons we've slain:
// https://github.com/withastro/astro/issues/2625
// https://github.com/withastro/astro/issues/3309
/** @lintignore */
export const dateTimeFormat = new Intl.DateTimeFormat([], {
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hour12: false,
});

// NOTE: this is a public type now
export interface AstroLoggerMessage {
	/**
	 * Label associated to the message. Used by Astro for pretty logging
	 */
	label: string | null;
	/**
	 * The level of the log
	 */
	level: AstroLoggerLevel;
	/**
	 * The message of the log
	 */
	message: string;
	/**
	 * Whether a newline should be appended to the end of the message i.e. message + '\n'
	 */
	newLine: boolean;
}

export const levels: Record<AstroLoggerLevel, number> = {
	debug: 20,
	info: 30,
	warn: 40,
	error: 50,
	silent: 90,
};

/** Full logging API */
function log(
	opts: AstroLogOptions,
	level: AstroLoggerLevel,
	label: string | null,
	message: string,
	newLine = true,
) {
	const logLevel = opts.level;
	const dest = opts.destination;
	const event: AstroLoggerMessage = {
		label,
		level,
		message,
		newLine,
	};

	// test if this level is enabled or not
	if (!isLogLevelEnabled(logLevel, level)) {
		return; // do nothing
	}

	dest.write(event);
}

export function isLogLevelEnabled(configuredLogLevel: AstroLoggerLevel, level: AstroLoggerLevel) {
	return levels[configuredLogLevel] <= levels[level];
}

/** Emit a user-facing message. Useful for UI and other console messages. */
function info(opts: AstroLogOptions, label: string | null, message: string, newLine = true) {
	return log(opts, 'info', label, message, newLine);
}

/** Emit a warning message. Useful for high-priority messages that aren't necessarily errors. */
function warn(opts: AstroLogOptions, label: string | null, message: string, newLine = true) {
	return log(opts, 'warn', label, message, newLine);
}

/** Emit an error message, Useful when Astro can't recover from some error. */
function error(opts: AstroLogOptions, label: string | null, message: string, newLine = true) {
	return log(opts, 'error', label, message, newLine);
}

export function debug(...args: any[]) {
	if ('_astroGlobalDebug' in globalThis) {
		(globalThis as any)._astroGlobalDebug(...args);
	}
}

/**
 * Get the prefix for a log message.
 * This includes the timestamp, log level, and label all properly formatted
 * with colors. This is shared across different loggers, so it's defined here.
 */
export function getEventPrefix({ level, label }: AstroLoggerMessage) {
	const timestamp = `${dateTimeFormat.format(new Date())}`;
	const prefix = [];
	if (level === 'error' || level === 'warn') {
		prefix.push(colors.bold(timestamp));
		prefix.push(`[${level.toUpperCase()}]`);
	} else {
		prefix.push(timestamp);
	}
	if (label) {
		prefix.push(`[${label}]`);
	}
	if (level === 'error') {
		return colors.red(prefix.join(' '));
	}
	if (level === 'warn') {
		return colors.yellow(prefix.join(' '));
	}
	if (prefix.length === 1) {
		return colors.dim(prefix[0]);
	}
	return colors.dim(prefix[0]) + ' ' + colors.blue(prefix.splice(1).join(' '));
}

/** Print out a timer message for debug() */
export function timerMessage(message: string, startTime: number = Date.now()) {
	let timeDiff = Date.now() - startTime;
	let timeDisplay =
		timeDiff < 750 ? `${Math.round(timeDiff)}ms` : `${(timeDiff / 1000).toFixed(1)}s`;
	return `${message}   ${colors.dim(timeDisplay)}`;
}

export class AstroLogger {
	options: AstroLogOptions;
	constructor(options: AstroLogOptions) {
		this.options = options;
	}

	info(label: AstroLoggerLabel | null, message: string, newLine = true) {
		info(this.options, label, message, newLine);
	}
	warn(label: AstroLoggerLabel | null, message: string, newLine = true) {
		warn(this.options, label, message, newLine);
	}
	error(label: AstroLoggerLabel | null, message: string, newLine = true) {
		error(this.options, label, message, newLine);
	}
	debug(label: AstroLoggerLabel, ...messages: any[]) {
		debug(label, ...messages);
	}

	level() {
		return this.options.level;
	}

	forkIntegrationLogger(label: string) {
		return new AstroIntegrationLogger(this.options, label);
	}

	setDestination(destination: AstroLoggerDestination<AstroLoggerMessage>) {
		this.options.destination = destination;
	}

	/**
	 * It calls the `close` function of the provided destination, if it exists.
	 */
	close() {
		if (this.options.destination.close) {
			this.options.destination.close();
		}
	}

	/**
	 * It calls the `flush` function of the provided destinatin, if it exists.
	 */
	flush() {
		if (this.options.destination.flush) {
			this.options.destination.flush();
		}
	}
}

export class AstroIntegrationLogger {
	options: AstroLogOptions;
	label: string;

	constructor(logging: AstroLogOptions, label: string) {
		this.options = logging;
		this.label = label;
	}

	/**
	 * Creates a new logger instance with a new label, but the same log options.
	 */
	fork(label: string): AstroIntegrationLogger {
		return new AstroIntegrationLogger(this.options, label);
	}

	info(message: string) {
		info(this.options, this.label, message);
	}
	warn(message: string) {
		warn(this.options, this.label, message);
	}
	error(message: string) {
		error(this.options, this.label, message);
	}
	debug(message: string) {
		debug(this.label, message);
	}
}
