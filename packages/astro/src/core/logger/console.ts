import { getEventPrefix, type LogMessage, type LogWritable, levels } from './core.js';

export const consoleLogDestination: LogWritable<LogMessage> = {
	write(event: LogMessage) {
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
