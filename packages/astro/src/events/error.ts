import { ZodError } from 'zod';
import { AstroErrorCodes, ErrorWithMetadata } from '../core/errors.js';

const EVENT_ERROR = 'ASTRO_CLI_ERROR';

interface ErrorEventPayload {
	code: number | undefined;
	isFatal: boolean;
	plugin?: string | undefined;
	cliCommand: string;
	anonymousMessageHint?: string | undefined;
}

interface ConfigErrorEventPayload extends ErrorEventPayload {
	isConfig: true;
	configErrorPaths: string[];
}

/**
 * This regex will grab a small snippet at the start of an error message.
 * This was designed to stop capturing at the first sign of some non-message
 * content like a filename, filepath, or any other code-specific value.
 * We also trim this value even further to just a few words.
 *
 * Our goal is to remove this entirely before v1.0.0 is released, as we work
 * to add a proper error code system (see AstroErrorCodes for examples).
 *
 * TODO(fks): Remove around v1.0.0 release.
 */
const ANONYMIZE_MESSAGE_REGEX = /^(\w| )+/;
function anonymizeErrorMessage(msg: string): string | undefined {
	const matchedMessage = msg.match(ANONYMIZE_MESSAGE_REGEX);
	if (!matchedMessage || !matchedMessage[0]) {
		return undefined;
	}
	return matchedMessage[0].trim().substring(0, 20);
}

export function eventConfigError({
	err,
	cmd,
	isFatal,
}: {
	err: ZodError;
	cmd: string;
	isFatal: boolean;
}): { eventName: string; payload: ConfigErrorEventPayload }[] {
	const payload: ConfigErrorEventPayload = {
		code: AstroErrorCodes.ConfigError,
		isFatal,
		isConfig: true,
		cliCommand: cmd,
		configErrorPaths: err.issues.map((issue) => issue.path.join('.')),
	};
	return [{ eventName: EVENT_ERROR, payload }];
}

export function eventError({
	cmd,
	err,
	isFatal,
}: {
	err: ErrorWithMetadata;
	cmd: string;
	isFatal: boolean;
}): { eventName: string; payload: ErrorEventPayload }[] {
	const payload: ErrorEventPayload = {
		code: err.code || AstroErrorCodes.UnknownError,
		plugin: err.plugin,
		cliCommand: cmd,
		isFatal: isFatal,
		anonymousMessageHint: anonymizeErrorMessage(err.message),
	};
	return [{ eventName: EVENT_ERROR, payload }];
}
