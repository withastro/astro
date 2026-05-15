import { AstroError, AstroErrorData } from '../core/errors/index.js';
const EVENT_ERROR = 'ASTRO_CLI_ERROR';
const ANONYMIZE_MESSAGE_REGEX = /^(?:\w| )+/;
function anonymizeErrorMessage(msg) {
	const matchedMessage = ANONYMIZE_MESSAGE_REGEX.exec(msg);
	if (!matchedMessage?.[0]) {
		return void 0;
	}
	return matchedMessage[0].trim().substring(0, 20);
}
function eventConfigError({ err, cmd, isFatal }) {
	const payload = {
		name: 'ZodError',
		isFatal,
		isConfig: true,
		cliCommand: cmd,
		configErrorPaths: err.issues.map((issue) => issue.path.join('.')),
	};
	return [{ eventName: EVENT_ERROR, payload }];
}
function eventError({ cmd, err, isFatal }) {
	const errorData = AstroError.is(err) && AstroErrorData[err.name];
	const payload = {
		name: err.name,
		plugin: err.plugin,
		cliCommand: cmd,
		isFatal,
		anonymousMessageHint:
			errorData && errorData.message
				? getSafeErrorMessage(errorData.message)
				: anonymizeErrorMessage(err.message),
	};
	return [{ eventName: EVENT_ERROR, payload }];
}
function getSafeErrorMessage(message) {
	if (typeof message === 'string') {
		return message;
	} else {
		return String.raw({
			raw: extractStringFromFunction(message.toString()),
		});
	}
	function extractStringFromFunction(func) {
		const arrowIndex = func.indexOf('=>') + '=>'.length;
		return func
			.slice(arrowIndex)
			.trim()
			.slice(1, -1)
			.replace(
				/\$\{([^}]+)\}/g,
				(_str, match1) =>
					`${match1
						.split(/\.?(?=[A-Z])/)
						.join('_')
						.toUpperCase()}`,
			)
			.replace(/\\`/g, '`');
	}
}
export { eventConfigError, eventError };
