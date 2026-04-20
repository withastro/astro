import {
	getEventPrefix,
	type AstroLoggerMessage,
	type AstroLoggerDestination,
	levels,
	type AstroLoggerLevel,
	AstroLogger,
} from '../core.js';

function consoleLogDestination(
	level: AstroLoggerLevel = 'info',
): AstroLoggerDestination<AstroLoggerMessage> {
	return {
		write(event: AstroLoggerMessage) {
			let dest = console.error;
			if (levels[event.level] < levels['error']) {
				dest = console.info;
			}

			if (levels[event.level] < levels[level]) {
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

type Options = {
	level?: AstroLoggerLevel;
};
export default function (options?: Options): AstroLoggerDestination<AstroLoggerMessage> {
	return consoleLogDestination(options?.level ?? 'info');
}
