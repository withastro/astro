import type { SSRManifest } from '../core/app/types.js';
import type { AstroLogger } from '../core/logger/core.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
export declare function recordServerError(
	loader: ModuleLoader,
	manifest: SSRManifest,
	logger: AstroLogger,
	err: Error,
): {
	errorWithMetadata: import('../core/errors/errors.js').ErrorWithMetadata;
};
