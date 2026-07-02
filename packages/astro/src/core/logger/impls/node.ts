import {
	AstroLogger,
	type AstroLoggerDestination,
	type AstroLoggerLevel,
	type AstroLoggerMessage,
	getEventPrefix,
	levels,
} from '../core.js';
import type { AstroInlineConfig } from '../../../types/public/index.js';
import { matchesLevel } from '../public.js';

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

			let dest = console.error;
			if (levels[event.level] < levels['error']) {
				dest = console.log;
			}

			if (event.label === 'SKIP_FORMAT') {
				dest(event.message);
			} else {
				dest(getEventPrefix(event) + ' ' + event.message);
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
