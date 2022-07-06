import { bold, cyan, dim, red, reset, yellow } from 'kleur/colors';
import { format as utilFormat } from 'util';
import type { LogMessage } from './core.js';
import { dateTimeFormat, levels } from './core.js';

let lastMessage: string;
let lastMessageCount = 1;
export const consoleLogDestination = {
	write(event: LogMessage) {
		// eslint-disable-next-line no-console
		let dest = console.error;
		if (levels[event.level] < levels['error']) {
			// eslint-disable-next-line no-console
			dest = console.log;
		}

		function getPrefix() {
			let prefix = '';
			let type = event.type;
			if (type) {
				// hide timestamp when type is undefined
				prefix += dim(dateTimeFormat.format(new Date()) + ' ');
				if (event.level === 'info') {
					type = bold(cyan(`[${type}]`));
				} else if (event.level === 'warn') {
					type = bold(yellow(`[${type}]`));
				} else if (event.level === 'error') {
					type = bold(red(`[${type}]`));
				}

				prefix += `${type} `;
			}
			return reset(prefix);
		}

		let message = utilFormat(...event.args);
		// For repeat messages, only update the message counter
		if (message === lastMessage) {
			lastMessageCount++;
			message = `${message} ${yellow(`(x${lastMessageCount})`)}`;
		} else {
			lastMessage = message;
			lastMessageCount = 1;
		}
		const outMessage = getPrefix() + message;
		dest(outMessage);
		return true;
	},
};
