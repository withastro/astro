import { bold, cyan, dim, red, yellow, reset } from 'kleur/colors';
import stringWidth from 'string-width';
import debugPackage from 'debug';
import { format as utilFormat } from 'util';
import * as readline from 'readline';
import { Writable } from 'stream';
import { info, warn, error, dateTimeFormat } from './core.js';

type ConsoleStream = Writable & {
	fd: 1 | 2;
};

let lastMessage: string;
let lastMessageCount = 1;
export const nodeLogDestination = new Writable({
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
				prefix += dim(dateTimeFormat.format(new Date()) + ' ');
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
				let cols = (dest as unknown as typeof process.stdout).columns;
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

interface LogWritable<T> {
	write: (chunk: T) => boolean;
}

export type LoggerLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'; // same as Pino
export type LoggerEvent = 'info' | 'warn' | 'error';

export interface LogOptions {
	dest?: LogWritable<LogMessage>;
	level?: LoggerLevel;
}

export const nodeLogOptions: Required<LogOptions> = {
	dest: nodeLogDestination,
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

// This is gross, but necessary since we are depending on globals.
(globalThis as any)._astroGlobalDebug = debug;

// A default logger for when too lazy to pass LogOptions around.
export const logger = {
	info: info.bind(null, nodeLogOptions),
	warn: warn.bind(null, nodeLogOptions),
	error: error.bind(null, nodeLogOptions),
};

export function enableVerboseLogging() {
	//debugPackage.enable('*,-babel');
	debug('cli', '--verbose flag enabled! Enabling: DEBUG="*,-babel"');
	debug(
		'cli',
		'Tip: Set the DEBUG env variable directly for more control. Example: "DEBUG=astro:*,vite:* astro build".'
	);
}
