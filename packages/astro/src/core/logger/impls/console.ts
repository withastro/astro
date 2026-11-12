import {
	getEventPrefix,
	type AstroLoggerDestination,
	levels,
	type AstroLoggerLevel,
	AstroLogger,
} from '../core.js';
import type { NodeHandlerConfig } from './node.js';
import { matchesLevel } from '../public.js';

export type ConsoleHandlerConfig = {
	level?: AstroLoggerLevel;
};

function consoleLogDestination(config: ConsoleHandlerConfig = {}): AstroLoggerDestination {
	const { level = 'info' } = config;
	return {
		write(event) {
			let dest = console.error;
			if (levels[event.level] < levels['error']) {
				dest = console.info;
			}

			if (!matchesLevel(event.level, level)) {
				return;
			}

			if (event.label === 'SKIP_FORMAT') {
				dest(event.message);
			} else {
				dest(getEventPrefix(event) + ' ' + event.message);
			}
		},
	};
}

export function createConsoleLogger({ level }: { level: AstroLoggerLevel }): AstroLogger {
	return new AstroLogger({
		level,
		destination: consoleLogDestination(),
	});
}

export default function (options?: NodeHandlerConfig): AstroLoggerDestination {
	return consoleLogDestination(options);
}
