import type { Writable } from 'node:stream';
import { inspect } from 'node:util';
import colors from 'piccolore';
import type { AstroInlineConfig } from '../../types/public/config.js';
import { Logger } from './core.js';
import { getEventPrefix, type LogMessage, type LogWritable, levels } from './core.js';

type ConsoleStream = Writable & {
	fd: 1 | 2;
};

export const nodeLogDestination: LogWritable<LogMessage> = {
	write(event: LogMessage) {
		let dest: ConsoleStream = process.stderr;
		if (levels[event.level] < levels['error']) {
			dest = process.stdout;
		}
		let trailingLine = event.newLine ? '\n' : '';
		if (event.label === 'SKIP_FORMAT') {
			dest.write(event.message + trailingLine);
		} else {
			dest.write(getEventPrefix(event) + ' ' + event.message + trailingLine);
		}
		return true;
	},
};

interface DebugLogger {
	lastTime: number;
	namespace: string;
	color: (text: string) => string;
}

const debuggers: Record<string, DebugLogger> = {};

// Color functions array for namespace coloring (similar to debug package)
const colorFunctions = [
	colors.cyan,
	colors.magenta,
	colors.blue,
	colors.yellow,
	colors.green,
	colors.red,
	colors.gray,
];

function selectColorFunction(namespace: string): (text: string) => string {
	let hash = 0;
	for (let i = 0; i < namespace.length; i++) {
		hash = (hash << 5) - hash + namespace.charCodeAt(i);
		hash |= 0;
	}
	return colorFunctions[Math.abs(hash) % colorFunctions.length];
}

function humanizeTime(ms: number): string {
	if (ms >= 1000) {
		return `${(ms / 1000).toFixed(1)}s`;
	}
	return `${ms}ms`;
}

/**
 * Emit a message only shown in debug mode.
 * Mimics the debug package's behavior and format.
 * You can enable these logs with the `DEBUG=astro:*` environment variable.
 */
function debug(type: string, ...messages: any[]) {
	const namespace = `astro:${type}`;

	// Check if debug is enabled for this namespace before doing anything
	if (!isDebugEnabled(namespace)) {
		return;
	}

	// Initialize logger for this namespace if needed
	if (!debuggers[namespace]) {
		debuggers[namespace] = {
			lastTime: Date.now(),
			namespace,
			color: selectColorFunction(namespace),
		};
	}

	const logger = debuggers[namespace];
	const now = Date.now();
	const delta = now - logger.lastTime;
	logger.lastTime = now;

	const prefix = logger.color(namespace);
	const diff = logger.color(`+${humanizeTime(delta)}`);

	// Format each message
	for (const message of messages) {
		let formatted: string;
		if (typeof message === 'string') {
			formatted = message;
		} else {
			// Use util.inspect for objects (similar to debug package)
			formatted = inspect(message, { colors: true, depth: null });
		}

		// Add prefix to each line (like debug package does)
		const lines = formatted.split('\n');
		for (let i = 0; i < lines.length; i++) {
			if (i === 0) {
				process.stderr.write(`  ${prefix} ${lines[i]} ${diff}\n`);
			} else {
				process.stderr.write(`  ${prefix} ${lines[i]}\n`);
			}
		}
	}
}

/**
 * Check if debug logging is enabled for a namespace based on DEBUG env var.
 * Supports patterns like: DEBUG=astro:*, DEBUG=astro:cli, DEBUG=*
 */
function isDebugEnabled(namespace: string): boolean {
	const envDebug = process.env.DEBUG;
	if (!envDebug) return false;

	const patterns = envDebug.split(',').map((p) => p.trim());
	return patterns.some((pattern) => {
		if (pattern === '*') return true;
		if (pattern.endsWith(':*')) {
			const prefix = pattern.slice(0, -2);
			return namespace === prefix || namespace.startsWith(prefix + ':');
		}
		return namespace === pattern;
	});
}

/**
 * Enable verbose debug logging for Astro and Vite.
 * This updates the DEBUG environment variable.
 * Since debug() now checks isDebugEnabled() on every call, we don't need to recreate loggers.
 */
export function enableVerboseLogging() {
	process.env.DEBUG = 'astro:*,vite:*';

	debug('cli', '--verbose flag enabled! Enabling: DEBUG="astro:*,vite:*"');
	debug(
		'cli',
		'Tip: Set the DEBUG env variable directly for more control. Example: "DEBUG=astro:*,vite:* astro build".',
	);
}

// This is gross, but necessary since we are depending on globals.
(globalThis as any)._astroGlobalDebug = debug;

export function createNodeLogger(inlineConfig: AstroInlineConfig): Logger {
	if (inlineConfig.logger) return inlineConfig.logger;

	return new Logger({
		dest: nodeLogDestination,
		level: inlineConfig.logLevel ?? 'info',
	});
}
