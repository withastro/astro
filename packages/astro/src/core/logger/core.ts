import { dim } from 'kleur/colors';
import stringWidth from 'string-width';

interface LogWritable<T> {
	write: (chunk: T) => boolean;
}

export type LoggerLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'; // same as Pino
export type LoggerEvent = 'info' | 'warn' | 'error';

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
	type: string | null;
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
export function log(
	opts: LogOptions,
	level: LoggerLevel,
	type: string | null,
	message: string,
) {
	const logLevel = opts.level;
	const dest = opts.dest;
	const event: LogMessage = {
		type,
		level,
		message
	};

	// test if this level is enabled or not
	if (levels[logLevel] > levels[level]) {
		return; // do nothing
	}

	dest.write(event);
}

/** Emit a user-facing message. Useful for UI and other console messages. */
export function info(opts: LogOptions, type: string | null, message: string) {
	return log(opts, 'info', type, message);
}

/** Emit a warning message. Useful for high-priority messages that aren't necessarily errors. */
export function warn(opts: LogOptions, type: string | null, message: string) {
	return log(opts, 'warn', type, message);
}

/** Emit a error message, Useful when Astro can't recover from some error. */
export function error(opts: LogOptions, type: string | null, message: string) {
	return log(opts, 'error', type, message);
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
	if (process.argv.includes('--verbose')) {
		defaultLogLevel = 'debug';
	} else if (process.argv.includes('--silent')) {
		defaultLogLevel = 'silent';
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
