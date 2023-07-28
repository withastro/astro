/* eslint-disable no-console */
import { collectErrorMetadata } from '../core/errors/dev/index.js';
import { astroConfigZodErrors } from '../core/errors/errors.js';
import { createSafeError } from '../core/errors/index.js';
import { debug } from '../core/logger/core.js';
import { formatErrorMessage } from '../core/messages.js';
import { eventError, telemetry } from '../events/index.js';

/** Display error and exit */
export async function throwAndExit(cmd: string, err: unknown) {
	let telemetryPromise: Promise<any>;
	let errorMessage: string;
	function exitWithErrorMessage() {
		console.error(errorMessage);
		process.exit(1);
	}

	const safeError = createSafeError(err);
	// Suppress ZodErrors from AstroConfig as the pre-logged error is sufficient
	if (astroConfigZodErrors.has(safeError)) return;

	const errorWithMetadata = collectErrorMetadata(safeError);
	telemetryPromise = telemetry.record(eventError({ cmd, err: errorWithMetadata, isFatal: true }));
	errorMessage = formatErrorMessage(errorWithMetadata);

	// Timeout the error reporter (very short) because the user is waiting.
	// NOTE(fks): It is better that we miss some events vs. holding too long.
	// TODO(fks): Investigate using an AbortController once we drop Node v14.
	setTimeout(exitWithErrorMessage, 400);
	// Wait for the telemetry event to send, then exit. Ignore any error.
	await telemetryPromise
		.catch((err2) => debug('telemetry', `record() error: ${err2.message}`))
		.then(exitWithErrorMessage);
}
