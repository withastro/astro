import colors from 'piccolore';
const AstroLoggerLabels = [
	'add',
	'build',
	'check',
	'config',
	'content',
	'crypto',
	'deprecated',
	'markdown',
	'router',
	'types',
	'vite',
	'watch',
	'middleware',
	'preferences',
	'redirects',
	'sync',
	'session',
	'toolbar',
	'assets',
	'env',
	'update',
	'adapter',
	'islands',
	'cache',
	'csp',
	// SKIP_FORMAT: A special label that tells the logger not to apply any formatting.
	// Useful for messages that are already formatted, like the server start message.
	'SKIP_FORMAT',
];
const dateTimeFormat = new Intl.DateTimeFormat([], {
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hour12: false,
});
const levels = {
	debug: 20,
	info: 30,
	warn: 40,
	error: 50,
	silent: 90,
};
function log(opts, level, label, message, newLine = true) {
	const logLevel = opts.level;
	const dest = opts.destination;
	const event = {
		label,
		level,
		message,
		newLine,
	};
	if (!isLogLevelEnabled(logLevel, level)) {
		return;
	}
	dest.write(event);
}
function isLogLevelEnabled(configuredLogLevel, level) {
	return levels[configuredLogLevel] <= levels[level];
}
function info(opts, label, message, newLine = true) {
	return log(opts, 'info', label, message, newLine);
}
function warn(opts, label, message, newLine = true) {
	return log(opts, 'warn', label, message, newLine);
}
function error(opts, label, message, newLine = true) {
	return log(opts, 'error', label, message, newLine);
}
function debug(...args) {
	if ('_astroGlobalDebug' in globalThis) {
		globalThis._astroGlobalDebug(...args);
	}
}
function getEventPrefix({ level, label }) {
	const timestamp = `${dateTimeFormat.format(/* @__PURE__ */ new Date())}`;
	const prefix = [];
	if (level === 'error' || level === 'warn') {
		prefix.push(colors.bold(timestamp));
		prefix.push(`[${level.toUpperCase()}]`);
	} else {
		prefix.push(timestamp);
	}
	if (label) {
		prefix.push(`[${label}]`);
	}
	if (level === 'error') {
		return colors.red(prefix.join(' '));
	}
	if (level === 'warn') {
		return colors.yellow(prefix.join(' '));
	}
	if (prefix.length === 1) {
		return colors.dim(prefix[0]);
	}
	return colors.dim(prefix[0]) + ' ' + colors.blue(prefix.splice(1).join(' '));
}
function timerMessage(message, startTime = Date.now()) {
	let timeDiff = Date.now() - startTime;
	let timeDisplay =
		timeDiff < 750 ? `${Math.round(timeDiff)}ms` : `${(timeDiff / 1e3).toFixed(1)}s`;
	return `${message}   ${colors.dim(timeDisplay)}`;
}
class AstroLogger {
	options;
	constructor(options) {
		this.options = options;
	}
	info(label, message, newLine = true) {
		info(this.options, label, message, newLine);
	}
	warn(label, message, newLine = true) {
		warn(this.options, label, message, newLine);
	}
	error(label, message, newLine = true) {
		error(this.options, label, message, newLine);
	}
	debug(label, ...messages) {
		debug(label, ...messages);
	}
	level() {
		return this.options.level;
	}
	forkIntegrationLogger(label) {
		return new AstroIntegrationLogger(this.options, label);
	}
	setDestination(destination) {
		this.options.destination = destination;
	}
	/**
	 * It calls the `close` function of the provided destination, if it exists.
	 */
	close() {
		if (this.options.destination.close) {
			this.options.destination.close();
		}
	}
	/**
	 * It calls the `flush` function of the provided destinatin, if it exists.
	 */
	flush() {
		if (this.options.destination.flush) {
			this.options.destination.flush();
		}
	}
}
class AstroIntegrationLogger {
	options;
	label;
	constructor(logging, label) {
		this.options = logging;
		this.label = label;
	}
	/**
	 * Creates a new logger instance with a new label, but the same log options.
	 */
	fork(label) {
		return new AstroIntegrationLogger(this.options, label);
	}
	info(message) {
		info(this.options, this.label, message);
	}
	warn(message) {
		warn(this.options, this.label, message);
	}
	error(message) {
		error(this.options, this.label, message);
	}
	debug(message) {
		debug(this.label, message);
	}
	/**
	 * It calls the `flush` function of the provided destination, if it exists.
	 */
	flush() {
		if (this.options.destination.flush) {
			this.options.destination.flush();
		}
	}
	/**
	 * It calls the `close` function of the provided destination, if it exists.
	 */
	close() {
		if (this.options.destination.close) {
			this.options.destination.close();
		}
	}
}
export {
	AstroIntegrationLogger,
	AstroLogger,
	dateTimeFormat,
	debug,
	getEventPrefix,
	isLogLevelEnabled,
	levels,
	timerMessage,
};
