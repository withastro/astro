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
import { matchesLevel } from '../public.js';

type ConsoleStream = Writable & {
	fd: 1 | 2;
};

export type NodeHandlerConfig = {
	level?: AstroLoggerLevel;
};

function nodeLogDestination(
	config: NodeHandlerConfig = {},
): AstroLoggerDestination<AstroLoggerMessage> {
	const { level = 'info' } = config;
	return {
		write(event: AstroLoggerMessage) {
			let dest: ConsoleStream = process.stderr;
			if (levels[event.level] < levels['error']) {
				dest = process.stdout;
			}

			if (!matchesLevel(event.level, level)) {
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

export default function (options?: NodeHandlerConfig): AstroLoggerDestination<AstroLoggerMessage> {
	return nodeLogDestination(options);
}

export function createNodeLoggerFromFlags(inlineConfig: AstroInlineConfig): AstroLogger {
	if (inlineConfig.logger) return inlineConfig.logger;

	return new AstroLogger({
		destination: nodeLogDestination(),
		level: inlineConfig.logLevel ?? 'info',
	});
}
