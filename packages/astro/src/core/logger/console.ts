import type { AstroConfig } from '../../@types/astro';
import type { LogMessage } from './core.js';
import { bold, cyan, dim, red, yellow, reset } from 'kleur/colors';
import stringWidth from 'string-width';
import { format as utilFormat } from 'util';
import { levels, dateTimeFormat } from './core.js';

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
			if (levels[event.level] < levels['error']) {
				let lines = 1;
				let len = stringWidth(`${getPrefix()}${message}`);
				let cols = (dest as unknown as typeof process.stdout).columns;
				if (len > cols) {
					lines = Math.ceil(len / cols);
				}
				for (let i = 0; i < lines; i++) {
					/*readline.clearLine(dest, 0);
					readline.cursorTo(dest, 0);
					readline.moveCursor(dest, 0, -1);*/
				}
			}
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
