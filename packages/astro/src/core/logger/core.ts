import { dim } from 'kleur/colors';
import stringWidth from 'string-width';

interface LogWritable<T> {
	write: (chunk: T) => boolean;
}

export type LoggerLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'; // same as Pino

export interface LogOptions {
	dest: LogWritable<LogMessage>;
	level: LoggerLevel;
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
export const dateTimeFormat = new Intl.DateTimeFormat([], {
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
});

export interface LogMessage {
	label: string | null;
	level: LoggerLevel;
	message: string;
}

export const levels: Record<LoggerLevel, number> = {
	debug: 20,
	info: 30,
	warn: 40,
	error: 50,
	silent: 90,
};

/** Full logging API */
export function log(opts: LogOptions, level: LoggerLevel, label: string | null, message: string) {
	const logLevel = opts.level;
	const dest = opts.dest;
	const event: LogMessage = {
		label,
		level,
		message,
	};

	// test if this level is enabled or not
	if (levels[logLevel] > levels[level]) {
		return; // do nothing
	}

	dest.write(event);
}

/** Emit a user-facing message. Useful for UI and other console messages. */
export function info(opts: LogOptions, label: string | null, message: string) {
	return log(opts, 'info', label, message);
}

/** Emit a warning message. Useful for high-priority messages that aren't necessarily errors. */
export function warn(opts: LogOptions, label: string | null, message: string) {
	return log(opts, 'warn', label, message);
}

/** Emit a error message, Useful when Astro can't recover from some error. */
export function error(opts: LogOptions, label: string | null, message: string) {
	return log(opts, 'error', label, message);
}

type LogFn = typeof info | typeof warn | typeof error;

export function table(opts: LogOptions, columns: number[]) {
	return function logTable(logFn: LogFn, ...input: Array<any>) {
		const message = columns.map((len, i) => padStr(input[i].toString(), len)).join(' ');
		logFn(opts, null, message);
	};
}

export function debug(...args: any[]) {
	if ('_astroGlobalDebug' in globalThis) {
		(globalThis as any)._astroGlobalDebug(...args);
	}
}

function padStr(str: string, len: number) {
	const strLen = stringWidth(str);
	if (strLen > len) {
		return str.substring(0, len - 3) + '...';
	}
	const spaces = Array.from({ length: len - strLen }, () => ' ').join('');
	return str + spaces;
}

export let defaultLogLevel: LoggerLevel;
if (typeof process !== 'undefined') {
	// This could be a shimmed environment so we don't know that `process` is the full
	// NodeJS.process. This code treats it as a plain object so TS doesn't let us
	// get away with incorrect assumptions.
	let proc: object = process;
	if ('argv' in proc && Array.isArray(proc.argv)) {
		if (proc.argv.includes('--verbose')) {
			defaultLogLevel = 'debug';
		} else if (proc.argv.includes('--silent')) {
			defaultLogLevel = 'silent';
		} else {
			defaultLogLevel = 'info';
		}
	} else {
		defaultLogLevel = 'info';
	}
} else {
	defaultLogLevel = 'info';
}

/** Print out a timer message for debug() */
export function timerMessage(message: string, startTime: number = Date.now()) {
	let timeDiff = Date.now() - startTime;
	let timeDisplay =
		timeDiff < 750 ? `${Math.round(timeDiff)}ms` : `${(timeDiff / 1000).toFixed(1)}s`;
	return `${message}   ${dim(timeDisplay)}`;
}

export class Logger {
	options: LogOptions;
	constructor(options: LogOptions) {
		this.options = options;
	}

	info(label: string, message: string) {
		info(this.options, label, message);
	}
	warn(label: string, message: string) {
		warn(this.options, label, message);
	}
	error(label: string, message: string) {
		error(this.options, label, message);
	}
	debug(label: string, message: string) {
		debug(this.options, label, message);
	}
}

export class AstroIntegrationLogger {
	options: LogOptions;
	label: string;

	constructor(logging: LogOptions, label: string) {
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
		debug(this.options, this.label, message);
	}
}
