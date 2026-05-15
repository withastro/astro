import { collectErrorMetadata } from '../core/errors/dev/index.js';
import { isAstroConfigZodError } from '../core/errors/errors.js';
import { createSafeError } from '../core/errors/index.js';
import { debug } from '../core/logger/core.js';
import { formatErrorMessage } from '../core/messages/runtime.js';
import { eventError, telemetry } from '../events/index.js';
async function throwAndExit(cmd, err) {
	if (isAstroConfigZodError(err)) {
		process.exit(1);
	}
	let telemetryPromise;
	let errorMessage;
	function exitWithErrorMessage() {
		console.error(errorMessage);
		process.exit(1);
	}
	const errorWithMetadata = collectErrorMetadata(createSafeError(err));
	telemetryPromise = telemetry.record(eventError({ cmd, err: errorWithMetadata, isFatal: true }));
	errorMessage = formatErrorMessage(errorWithMetadata, true);
	setTimeout(exitWithErrorMessage, 400);
	await telemetryPromise
		.catch((err2) => debug('telemetry', `record() error: ${err2.message}`))
		.then(exitWithErrorMessage);
}
export { throwAndExit };
