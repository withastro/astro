// eslint-disable no-console
import { bold, cyan, dim, red, reset, yellow } from 'kleur/colors';

const PREFIX = '[@astrojs/image]';

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
export type LoggerEvent = 'info' | 'warn' | 'error';

export interface LogMessage {
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

const log = (_level: LoggerLevel, dest: (message: string) => void) =>
	({ message, level }: LogMessage) => {
		if (levels[_level] >= levels[level]) {
			dest(message)
		}
	}

export const info = log('info', console.info);
export const debug = log('debug', console.debug);
export const warn = log('warn', console.warn);
export const error = log('error', console.error);
