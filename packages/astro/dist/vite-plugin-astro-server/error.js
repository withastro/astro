import { collectErrorMetadata } from '../core/errors/dev/index.js';
import { formatErrorMessage } from '../core/messages/runtime.js';
function recordServerError(loader, manifest, logger, err) {
	try {
		loader.fixStacktrace(err);
	} catch {}
	const errorWithMetadata = collectErrorMetadata(err, manifest.rootDir);
	logger.error(null, formatErrorMessage(errorWithMetadata, logger.level() === 'debug'));
	return {
		errorWithMetadata,
	};
}
export { recordServerError };
