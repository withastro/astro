import { getEventPrefix, levels, AstroLogger } from '../core.js';
import { matchesLevel } from '../public.js';
function consoleLogDestination(config = {}) {
	const { level = 'info' } = config;
	return {
		write(event) {
			let dest = console.error;
			if (levels[event.level] < levels['error']) {
				dest = console.info;
			}
			if (!matchesLevel(event.level, level)) {
				return;
			}
			if (event.label === 'SKIP_FORMAT') {
				dest(event.message);
			} else {
				dest(getEventPrefix(event) + ' ' + event.message);
			}
		},
	};
}
function createConsoleLogger({ level }) {
	return new AstroLogger({
		level,
		destination: consoleLogDestination(),
	});
}
function console_default(options) {
	return consoleLogDestination(options);
}
export { createConsoleLogger, console_default as default };
