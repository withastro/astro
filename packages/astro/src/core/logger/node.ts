import debugPackage from 'debug';
import { Writable } from 'node:stream';
import { getEventPrefix, levels, type LogMessage, type LogWritable } from './core.js';

type ConsoleStream = Writable & {
	fd: 1 | 2;
};

export const nodeLogDestination: LogWritable<LogMessage> = {
	write(event: LogMessage) {
		let dest: ConsoleStream = process.stderr;
		if (levels[event.level] < levels['error']) {
			dest = process.stdout;
		}
		if (event.label === 'SKIP_FORMAT') {
			dest.write(event.message + '\n');
		} else {
			dest.write(getEventPrefix(event) + ' ' + event.message + '\n');
		}
		return true;
	},
};

const debuggers: Record<string, debugPackage.Debugger['log']> = {};

/**
 * Emit a message only shown in debug mode.
 * Astro (along with many of its dependencies) uses the `debug` package for debug logging.
 * You can enable these logs with the `DEBUG=astro:*` environment variable.
 * More info https://github.com/debug-js/debug#environment-variables
 */
function debug(type: string, ...messages: Array<any>) {
	const namespace = `astro:${type}`;
	debuggers[namespace] = debuggers[namespace] || debugPackage(namespace);
	return debuggers[namespace](...messages);
}

// This is gross, but necessary since we are depending on globals.
(globalThis as any)._astroGlobalDebug = debug;

export function enableVerboseLogging() {
	debugPackage.enable('*,-babel');
	debug('cli', '--verbose flag enabled! Enabling: DEBUG="*,-babel"');
	debug(
		'cli',
		'Tip: Set the DEBUG env variable directly for more control. Example: "DEBUG=astro:*,vite:* astro build".'
	);
}
