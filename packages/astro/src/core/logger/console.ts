import {
	getEventPrefix,
	type AstroLogMessage,
	type AstroLoggerDestination,
	levels,
} from './core.js';

export const consoleLogDestination: AstroLoggerDestination<AstroLogMessage> = {
	write(event: AstroLogMessage) {
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
