import { bold, blue, dim, red, yellow } from 'kleur/colors';
import { Writable } from 'stream';
import { format as utilFormat } from 'util';

type ConsoleStream = Writable & {
	fd: 1 | 2;
};

// Hey, locales are pretty complicated! Be careful modifying this logic...
// If we throw at the top-level, international users can't use Astro.
//
// Using `[]` sets the default locale properly from the system!
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters
//
// Here be the dragons we've slain:
// https://github.com/withastro/astro/issues/2625
// https://github.com/withastro/astro/issues/3309
const dt = new Intl.DateTimeFormat([], {
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
});

export const defaultLogDestination = new Writable({
	objectMode: true,
	write(event: LogMessage, _, callback) {
		let dest: Writable = process.stderr;
		if (levels[event.level] < levels['error']) dest = process.stdout;

		dest.write(dim(dt.format(new Date()) + ' '));

		let type = event.type;
		if (type) {
			switch (event.level) {
				case 'info':
					type = bold(blue(type));
					break;
				case 'warn':
					type = bold(yellow(type));
					break;
				case 'error':
					type = bold(red(type));
					break;
			}

			dest.write(`[${type}] `);
		}

		dest.write(utilFormat(...event.args));
		dest.write('\n');

		callback();
	},
});

interface LogWritable<T> extends Writable {
	write: (chunk: T) => boolean;
}

export type LoggerLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'; // same as Pino
export type LoggerEvent = 'debug' | 'info' | 'warn' | 'error';

export let defaultLogLevel: LoggerLevel;
if (process.argv.includes('--verbose')) {
	defaultLogLevel = 'debug';
} else if (process.argv.includes('--silent')) {
	defaultLogLevel = 'silent';
} else {
	defaultLogLevel = 'info';
}

export interface LogOptions {
	dest?: LogWritable<LogMessage>;
	level?: LoggerLevel;
}

export const defaultLogOptions: Required<LogOptions> = {
	dest: defaultLogDestination,
	level: defaultLogLevel,
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

/** Full logging API */
export function log(
	opts: LogOptions = {},
	level: LoggerLevel,
	type: string | null,
	...args: Array<any>
) {
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

/** Emit a message only shown in debug mode */
export function debug(opts: LogOptions, type: string | null, ...messages: Array<any>) {
	return log(opts, 'debug', type, ...messages);
}

/** Emit a general info message (be careful using this too much!) */
export function info(opts: LogOptions, type: string | null, ...messages: Array<any>) {
	return log(opts, 'info', type, ...messages);
}

/** Emit a warning a user should be aware of */
export function warn(opts: LogOptions, type: string | null, ...messages: Array<any>) {
	return log(opts, 'warn', type, ...messages);
}

/** Emit a fatal error message the user should address. */
export function error(opts: LogOptions, type: string | null, ...messages: Array<any>) {
	return log(opts, 'error', type, ...messages);
}

// A default logger for when too lazy to pass LogOptions around.
export const logger = {
	debug: debug.bind(null, defaultLogOptions, 'debug'),
	info: info.bind(null, defaultLogOptions, 'info'),
	warn: warn.bind(null, defaultLogOptions, 'warn'),
	error: error.bind(null, defaultLogOptions, 'error'),
};
