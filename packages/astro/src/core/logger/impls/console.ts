import {
	getEventPrefix,
	type AstroLoggerMessage,
	type AstroLoggerDestination,
	levels,
	type AstroLoggerLevel,
	AstroLogger,
} from '../core.js';

const consoleLogDestination: AstroLoggerDestination<AstroLoggerMessage> = {
	write(event: AstroLoggerMessage) {
		let dest = console.error;
		if (levels[event.level] < levels['error']) {
			dest = console.info;
		}
		if (event.label === 'SKIP_FORMAT') {
			dest(event.message);
		} else {
			dest(getEventPrefix(event) + ' ' + event.message);
		}
		return true;
	},
};

export function createConsoleLogger({ level }: { level: AstroLoggerLevel }): AstroLogger {
	return new AstroLogger({
		level,
		destination: consoleLogDestination,
	});
}

export default function consoleLoggerFactory() {
	return consoleLogDestination;
}
