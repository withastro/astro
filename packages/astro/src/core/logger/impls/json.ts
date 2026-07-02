import {
	AstroLogger,
	type AstroLoggerDestination,
	type AstroLoggerLevel,
	type AstroLoggerMessage,
	levels,
} from '../core.js';
import type { AstroInlineConfig } from '../../../types/public/index.js';
import { matchesLevel } from '../public.js';

export type JsonHandlerConfig = {
	/**
	 * Whether the JSON line should format on multiple lines
	 */
	pretty?: boolean;
	/**
	 * The level of logs that should be printed by the logger.
	 */
	level?: AstroLoggerLevel;
};

export const SGR_REGEX = new RegExp(`${String.fromCharCode(0x1b)}\\[[0-9;]*m`, 'g');

export default function jsonLoggerDestination(
	config: JsonHandlerConfig = {},
): AstroLoggerDestination<AstroLoggerMessage> {
	const { pretty = false, level = 'info' } = config;
	return {
		write(event) {
			if (!matchesLevel(event.level, level)) {
				return;
			}

			let dest = console.error;
			if (levels[event.level] < levels['error']) {
				dest = console.log;
			}

			const message = event.message.replace(SGR_REGEX, '');
			if (pretty) {
				dest(
					JSON.stringify({ message, label: event.label, level: event.level }, null, 2),
				);
			} else {
				dest(
					JSON.stringify({ message, label: event.label, level: event.level }),
				);
			}
		},
	};
}

export function createJsonLoggerFromFlags(config: AstroInlineConfig) {
	return new AstroLogger({
		destination: jsonLoggerDestination({ pretty: false }),
		level: config.logLevel ?? 'info',
	});
}
