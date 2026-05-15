import { AstroLogger, getEventPrefix, levels } from '../core.js';
import { matchesLevel } from '../public.js';
function nodeLogDestination(config = {}) {
	const { level = 'info' } = config;
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
			if (event.label === 'SKIP_FORMAT') {
				dest.write(event.message + trailingLine);
			} else {
				dest.write(getEventPrefix(event) + ' ' + event.message + trailingLine);
			}
		},
	};
}
function node_default(options) {
	return nodeLogDestination(options);
}
function createNodeLoggerFromFlags(inlineConfig) {
	if (inlineConfig.logger) return inlineConfig.logger;
	return new AstroLogger({
		destination: nodeLogDestination(),
		level: inlineConfig.logLevel ?? 'info',
	});
}
export { createNodeLoggerFromFlags, node_default as default };
