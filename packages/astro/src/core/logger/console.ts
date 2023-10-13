import type { LogMessage } from './core.js';
import { getEventPrefix, levels } from './core.js';

export const consoleLogDestination = {
	write(event: LogMessage) {
		// eslint-disable-next-line no-console
		let dest = console.error;
		if (levels[event.level] < levels['error']) {
			// eslint-disable-next-line no-console
			dest = console.log;
		}
		dest(getEventPrefix(event) + ' ' + event.message);
		return true;
	},
};
