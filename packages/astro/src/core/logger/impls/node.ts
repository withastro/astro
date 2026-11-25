import {
	AstroLogger,
	type AstroLoggerDestination,
	type AstroLoggerLevel,
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
	/** Write every log level to this stream. By default, only errors go to stderr. */
	stream?: 'stdout' | 'stderr';
};

function nodeLogDestination(config: NodeHandlerConfig = {}): AstroLoggerDestination {
	const { level = 'info', stream } = config;
	return {
		write(event) {
			const dest: ConsoleStream = stream
				? process[stream]
				: levels[event.level] < levels['error']
					? process.stdout
					: process.stderr;

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

export default function (options?: NodeHandlerConfig): AstroLoggerDestination {
	return nodeLogDestination(options);
}

export function createNodeLoggerFromFlags(inlineConfig: AstroInlineConfig): AstroLogger {
	return new AstroLogger({
		destination: nodeLogDestination(),
		level: inlineConfig.logLevel ?? 'info',
	});
}
