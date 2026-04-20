import {
	AstroLogger,
	type AstroLoggerDestination,
	type AstroLoggerLevel,
	type AstroLoggerMessage,
	getEventPrefix,
	levels,
} from '../core.js';
import type { Writable } from 'node:stream';
import type { AstroInlineConfig } from '../../../types/public/index.js';

type ConsoleStream = Writable & {
	fd: 1 | 2;
};

function nodeLogDestination(
	level: AstroLoggerLevel = 'info',
): AstroLoggerDestination<AstroLoggerMessage> {
	return {
		write(event: AstroLoggerMessage) {
			let dest: ConsoleStream = process.stderr;
			if (levels[event.level] < levels['error']) {
				dest = process.stdout;
			}

			if (levels[event.level] < levels[level]) {
				return;
			}

			let trailingLine = event.newLine ? '\n' : '';
			if (event.label === 'SKIP_FORMAT') {
				dest.write(event.message + trailingLine);
			} else {
				dest.write(getEventPrefix(event) + ' ' + event.message + trailingLine);
			}
		},
	};
}

type Options = {
	level?: AstroLoggerLevel;
};
export default function (options?: Options): AstroLoggerDestination<AstroLoggerMessage> {
	return nodeLogDestination(options?.level ?? 'info');
}

export function createNodeLoggerFromFlags(inlineConfig: AstroInlineConfig): AstroLogger {
	if (inlineConfig.logger) return inlineConfig.logger;

	return new AstroLogger({
		destination: nodeLogDestination(),
		level: inlineConfig.logLevel ?? 'info',
	});
}
