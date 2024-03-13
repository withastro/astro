import { type LogMessage, type LogWritable, getEventPrefix, levels } from './core.js';

export const consoleLogDestination: LogWritable<LogMessage> = {
	write(event: LogMessage) {
		// eslint-disable-next-line no-console
		let dest = console.error;
		if (levels[event.level] < levels['error']) {
			// eslint-disable-next-line no-console
			dest = console.log;
		}
		if (event.label === 'SKIP_FORMAT') {
			dest(event.message);
		} else {
			dest(getEventPrefix(event) + ' ' + event.message);
		}
		return true;
	},
};
