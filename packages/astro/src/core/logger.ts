import type { AstroConfig } from '../@types/astro';
import { bold, cyan, dim, red, yellow, reset } from 'kleur/colors';
import { performance } from 'perf_hooks';
import { Writable } from 'stream';
import stringWidth from 'string-width';
import * as readline from 'readline';
import debugPackage from 'debug';
import { format as utilFormat } from 'util';
import { isBuildingToSSR } from './util.js';

type ConsoleStream = Writable & {
	fd: 1 | 2;
};

function getLoggerLocale(): string {
	const defaultLocale = 'en-US';
	if (process.env.LANG) {
		const extractedLocale = process.env.LANG.split('.')[0].replace(/_/g, '-');
		// Check if language code is atleast two characters long (ie. en, es).
		// NOTE: if "c" locale is encountered, the default locale will be returned.
		if (extractedLocale.length < 2) return defaultLocale;
		else return extractedLocale.substring(0, 5);
	} else return defaultLocale;
}

const dt = new Intl.DateTimeFormat(getLoggerLocale(), {
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
});

let lastMessage: string;
let lastMessageCount = 1;
export const defaultLogDestination = new Writable({
	objectMode: true,
	write(event: LogMessage, _, callback) {
		let dest: ConsoleStream = process.stderr;
		if (levels[event.level] < levels['error']) {
			dest = process.stdout;
		}

		function getPrefix() {
			let prefix = '';
			let type = event.type;
			if (type) {
				// hide timestamp when type is undefined
				prefix += dim(dt.format(new Date()) + ' ');
				if (event.level === 'info') {
					type = bold(cyan(`[${type}]`));
				} else if (event.level === 'warn') {
					type = bold(yellow(`[${type}]`));
				} else if (event.level === 'error') {
					type = bold(red(`[${type}]`));
				}

				prefix += `${type} `;
			}
			return reset(prefix);
		}

		let message = utilFormat(...event.args);
		// For repeat messages, only update the message counter
		if (message === lastMessage) {
			lastMessageCount++;
			if (levels[event.level] < levels['error']) {
				let lines = 1;
				let len = stringWidth(`${getPrefix()}${message}`);
				let cols = (dest as typeof process.stdout).columns;
				if (len > cols) {
					lines = Math.ceil(len / cols);
				}
				for (let i = 0; i < lines; i++) {
					readline.clearLine(dest, 0);
					readline.cursorTo(dest, 0);
					readline.moveCursor(dest, 0, -1);
				}
			}
			message = `${message} ${yellow(`(x${lastMessageCount})`)}`;
		} else {
			lastMessage = message;
			lastMessageCount = 1;
		}
		dest.write(getPrefix());
		dest.write(message);
		dest.write('\n');

		callback();
	},
});

interface LogWritable<T> extends Writable {
	write: (chunk: T) => boolean;
}

export type LoggerLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'; // same as Pino
export type LoggerEvent = 'info' | 'warn' | 'error';

export interface LogOptions {
	dest?: LogWritable<LogMessage>;
	level?: LoggerLevel;
}

export const defaultLogOptions: Required<LogOptions> = {
	dest: defaultLogDestination,
	level: 'info',
};

export interface LogMessage {
	type: string | null;
	level: LoggerLevel;
	message: string;
	args: Array<any>;
}

export const levels: Record<LoggerLevel, number> = {
	debug: 20,
	info: 30,
	warn: 40,
	error: 50,
	silent: 90,
};

export function enableVerboseLogging() {
	debugPackage.enable('*,-babel');
	debug('cli', '--verbose flag enabled! Enabling: DEBUG="*,-babel"');
	debug('cli', 'Tip: Set the DEBUG env variable directly for more control. Example: "DEBUG=astro:*,vite:* astro build".');
}

/** Full logging API */
export function log(opts: LogOptions = {}, level: LoggerLevel, type: string | null, ...args: Array<any>) {
	const logLevel = opts.level ?? defaultLogOptions.level;
	const dest = opts.dest ?? defaultLogOptions.dest;
	const event: LogMessage = {
		type,
		level,
		args,
		message: '',
	};

	// test if this level is enabled or not
	if (levels[logLevel] > levels[level]) {
		return; // do nothing
	}

	dest.write(event);
}

const debuggers: Record<string, debugPackage.Debugger['log']> = {};
/**
 * Emit a message only shown in debug mode.
 * Astro (along with many of its dependencies) uses the `debug` package for debug logging.
 * You can enable these logs with the `DEBUG=astro:*` environment variable.
 * More info https://github.com/debug-js/debug#environment-variables
 */
export function debug(type: string, ...messages: Array<any>) {
	const namespace = `astro:${type}`;
	debuggers[namespace] = debuggers[namespace] || debugPackage(namespace);
	return debuggers[namespace](...messages);
}

/** Emit a user-facing message. Useful for UI and other console messages. */
export function info(opts: LogOptions, type: string | null, ...messages: Array<any>) {
	return log(opts, 'info', type, ...messages);
}

/** Emit a warning message. Useful for high-priority messages that aren't necessarily errors. */
export function warn(opts: LogOptions, type: string | null, ...messages: Array<any>) {
	return log(opts, 'warn', type, ...messages);
}

/** Emit a error message, Useful when Astro can't recover from some error. */
export function error(opts: LogOptions, type: string | null, ...messages: Array<any>) {
	return log(opts, 'error', type, ...messages);
}

type LogFn = typeof info | typeof warn | typeof error;

export function table(opts: LogOptions, columns: number[]) {
	return function logTable(logFn: LogFn, ...input: Array<any>) {
		const messages = columns.map((len, i) => padStr(input[i].toString(), len));
		logFn(opts, null, ...messages);
	};
}

// A default logger for when too lazy to pass LogOptions around.
export const logger = {
	info: info.bind(null, defaultLogOptions),
	warn: warn.bind(null, defaultLogOptions),
	error: error.bind(null, defaultLogOptions),
};

function padStr(str: string, len: number) {
	const strLen = stringWidth(str);
	if (strLen > len) {
		return str.substring(0, len - 3) + '...';
	}
	const spaces = Array.from({ length: len - strLen }, () => ' ').join('');
	return str + spaces;
}

export let defaultLogLevel: LoggerLevel;
if (process.argv.includes('--verbose')) {
	defaultLogLevel = 'debug';
} else if (process.argv.includes('--silent')) {
	defaultLogLevel = 'silent';
} else {
	defaultLogLevel = 'info';
}

/** Print out a timer message for debug() */
export function timerMessage(message: string, startTime: number = performance.now()) {
	let timeDiff = performance.now() - startTime;
	let timeDisplay = timeDiff < 750 ? `${Math.round(timeDiff)}ms` : `${(timeDiff / 1000).toFixed(1)}s`;
	return `${message}   ${dim(timeDisplay)}`;
}

/**
 * A warning that SSR is experimental. Remove when we can.
 */
export function warnIfUsingExperimentalSSR(opts: LogOptions, config: AstroConfig) {
	if (isBuildingToSSR(config)) {
		warn(
			opts,
			'warning',
			bold(`Warning:`),
			` SSR support is still experimental and subject to API changes. If using in production pin your dependencies to prevent accidental breakage.`
		);
	}
}
