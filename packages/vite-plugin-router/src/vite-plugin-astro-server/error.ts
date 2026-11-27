import type { SSRManifest } from '../internal/core/app/types.js';
import { collectErrorMetadata } from '../internal/core/errors/dev/index.js';
import type { AstroLogger } from '../internal/core/logger/core.js';
import { formatErrorMessage } from '../internal/core/messages/error.js';
import type { ModuleLoader } from '../internal/core/module-loader/index.js';

export function recordServerError(
	loader: ModuleLoader,
	manifest: SSRManifest,
	logger: AstroLogger,
	err: Error,
) {
	// This could be a runtime error from Vite's SSR module, so try to fix it here
	try {
		loader.fixStacktrace(err);
	} catch {}

	// This is our last line of defense regarding errors where we still might have some information about the request
	// Our error should already be complete, but let's try to add a bit more through some guesswork
	const errorWithMetadata = collectErrorMetadata(err, manifest.rootDir);

	logger.error(null, formatErrorMessage(errorWithMetadata, logger.level() === 'debug'));

	return {
		errorWithMetadata,
	};
}
