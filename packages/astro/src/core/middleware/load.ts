import type { MiddlewareHandler } from '../../types/public/common.js';
import type { SSRManifest } from '../app/types.js';
import { createOriginCheckMiddleware } from '../app/origin-check.js';
import { createAsyncManifestMemo } from '../manifest/memo.js';
import { NOOP_MIDDLEWARE_FN } from './noop-middleware.js';
import { sequence } from './sequence.js';

// Snapshot of the already-resolved middleware, for the sync `peekMiddleware`
// accessor (reproduces `ContainerPipeline.insertRoute`'s synchronous
// `this.resolvedMiddleware` read).
const resolvedMiddleware = new WeakMap<SSRManifest, MiddlewareHandler>();

const middlewareMemo = createAsyncManifestMemo(async (manifest) => {
	let handler: MiddlewareHandler;
	// The middleware can be undefined when using edge middleware.
	// This is set to undefined by the plugin-ssr.ts
	if (manifest.middleware) {
		const middlewareInstance = await manifest.middleware();
		const onRequest = middlewareInstance.onRequest ?? NOOP_MIDDLEWARE_FN;
		const internalMiddlewares = [onRequest];
		if (manifest.checkOrigin) {
			// this middleware must be placed at the beginning because it needs to block incoming requests
			internalMiddlewares.unshift(createOriginCheckMiddleware());
		}
		handler = sequence(...internalMiddlewares);
	} else {
		handler = NOOP_MIDDLEWARE_FN;
	}
	resolvedMiddleware.set(manifest, handler);
	return handler;
});

/**
 * Resolves the middleware from the manifest and returns the `onRequest`
 * function (prefixed with the origin-check middleware when configured). If
 * `onRequest` isn't there, it returns a no-op function.
 */
export function getMiddleware(manifest: SSRManifest): Promise<MiddlewareHandler> {
	return middlewareMemo.get(manifest);
}

/**
 * The already-resolved middleware for a manifest, or `undefined` when
 * `getMiddleware` has not settled yet. Sync — used where a synchronous
 * snapshot is required (the container's `insertRoute`).
 */
export function peekMiddleware(manifest: SSRManifest): MiddlewareHandler | undefined {
	return resolvedMiddleware.get(manifest);
}

/**
 * Clears the cached middleware so it is re-resolved on the next request.
 * Called via HMR when middleware files change during development.
 */
export function clearMiddleware(manifest: SSRManifest): void {
	middlewareMemo.invalidate(manifest);
	resolvedMiddleware.delete(manifest);
}
