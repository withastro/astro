// eslint-disable no-console
import { bold, cyan, dim, green, red, yellow } from 'kleur/colors';

const PREFIX = '@astrojs/image';

// Hey, locales are pretty complicated! Be careful modifying this logic...
// If we throw at the top-level, international users can't use Astro.
//
// Using `[]` sets the default locale properly from the system!
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters
//
// Here be the dragons we've slain:
// https://github.com/withastro/astro/issues/2625
// https://github.com/withastro/astro/issues/3309
const dateTimeFormat = new Intl.DateTimeFormat([], {
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
});

export type LoggerLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'; // same as Pino

export interface LogMessage {
	level: LoggerLevel;
	message: string;
	prefix?: boolean;
	timestamp?: boolean;
}

export const levels: Record<LoggerLevel, number> = {
	debug: 20,
	info: 30,
	warn: 40,
	error: 50,
	silent: 90,
};

function getPrefix(level: LoggerLevel, timestamp: boolean) {
	let prefix = '';

	if (timestamp) {
		prefix += dim(dateTimeFormat.format(new Date()) + ' ');
	}

	switch (level) {
		case 'debug':
			prefix += bold(green(`[${PREFIX}] `));
			break;
		case 'info':
			prefix += bold(cyan(`[${PREFIX}] `));
			break;
		case 'warn':
			prefix += bold(yellow(`[${PREFIX}] `));
			break;
		case 'error':
			prefix += bold(red(`[${PREFIX}] `));
			break;
	}

	return prefix;
}

const log =
	(_level: LoggerLevel, dest: (message: string) => void) =>
	({ message, level, prefix = true, timestamp = true }: LogMessage) => {
		if (levels[_level] >= levels[level]) {
			dest(`${prefix ? getPrefix(level, timestamp) : ''}${message}`);
		}
	};

export const info = log('info', console.info);
export const debug = log('debug', console.debug);
export const warn = log('warn', console.warn);
export const error = log('error', console.error);
