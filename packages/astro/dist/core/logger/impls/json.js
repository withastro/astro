import { AstroLogger, levels } from '../core.js';
import { matchesLevel } from '../public.js';
const SGR_REGEX = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
function jsonLoggerDestination(config = {}) {
	const { pretty = false, level = 'info' } = config;
	return {
		write(event) {
			let dest = process.stderr;
			if (levels[event.level] < levels['error']) {
				dest = process.stdout;
			}
			if (!matchesLevel(event.level, level)) {
				return;
			}
			let trailingLine = event.newLine ? '\n' : '';
			const message = event.message.replace(SGR_REGEX, '');
			if (pretty) {
				dest.write(
					JSON.stringify({ message, label: event.label, level: event.level }, null, 2) +
						trailingLine,
				);
			} else {
				dest.write(
					JSON.stringify({ message, label: event.label, level: event.level }) + trailingLine,
				);
			}
		},
	};
}
function createJsonLoggerFromFlags(config) {
	return new AstroLogger({
		destination: jsonLoggerDestination({ pretty: false }),
		level: config.logLevel ?? 'info',
	});
}
export { SGR_REGEX, createJsonLoggerFromFlags, jsonLoggerDestination as default };
