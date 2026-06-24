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
			if (!matchesLevel(event.level, level)) {
				return;
			}

			let trailingLine = event.newLine ? '\n' : '';
			const payload =
				event.label === 'SKIP_FORMAT'
					? event.message + trailingLine
					: getEventPrefix(event) + ' ' + event.message + trailingLine;

			if (typeof process !== 'undefined' && process.stderr && process.stdout) {
				let dest: ConsoleStream = process.stderr;
				if (levels[event.level] < levels['error']) {
					dest = process.stdout;
				}
				dest.write(payload);
			} else {
				const dest = levels[event.level] >= levels['error'] ? console.error : console.info;
				dest(payload);
			}
		},
	};
}

export default function (options?: NodeHandlerConfig): AstroLoggerDestination<AstroLoggerMessage> {
	return nodeLogDestination(options);
}

export function createNodeLoggerFromFlags(inlineConfig: AstroInlineConfig): AstroLogger {
	return new AstroLogger({
		destination: nodeLogDestination(),
		level: inlineConfig.logLevel ?? 'info',
	});
}
