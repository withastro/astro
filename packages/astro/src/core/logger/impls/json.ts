import { type AstroLoggerDestination, type AstroLoggerMessage, levels } from '../core.js';
import type { Writable } from 'node:stream';

export type JonsHandlerConfig = {
	pretty: boolean;
};

type ConsoleStream = Writable & {
	fd: 1 | 2;
};

export const SGR_REGEX = new RegExp(`${String.fromCharCode(0x1b)}\\[[0-9;]*m`, 'g');

export default function (config: JonsHandlerConfig): AstroLoggerDestination<AstroLoggerMessage> {
	return {
		write(event) {
			let dest: ConsoleStream = process.stderr;
			if (levels[event.level] < levels['error']) {
				dest = process.stdout;
			}

			let trailingLine = event.newLine ? '\n' : '';
			const message = event.message.replace(SGR_REGEX, '');
			if (config.pretty) {
				dest.write(JSON.stringify({ message, label: event.label }, null, 2) + trailingLine);
			} else {
				dest.write(JSON.stringify({ message, label: event.label }) + trailingLine);
			}
		},
	};
}
