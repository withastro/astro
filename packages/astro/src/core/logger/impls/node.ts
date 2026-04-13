import {
	AstroLogger,
	type AstroLoggerDestination,
	type AstroLoggerMessage,
	getEventPrefix,
	levels,
} from '../core.js';
import type { Writable } from 'node:stream';
import type { AstroInlineConfig } from '../../../types/public/index.js';

type ConsoleStream = Writable & {
	fd: 1 | 2;
};

const nodeLogDestination: AstroLoggerDestination<AstroLoggerMessage> = {
	write(event: AstroLoggerMessage) {
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
	},
};

export default function (): AstroLoggerDestination<AstroLoggerMessage> {
	return nodeLogDestination;
}

export function createNodeLogger(inlineConfig: AstroInlineConfig): AstroLogger {
	if (inlineConfig.logger) return inlineConfig.logger;

	return new AstroLogger({
		destination: nodeLogDestination,
		level: inlineConfig.logLevel ?? 'info',
	});
}
