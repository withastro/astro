import type { MiddlewareHandler } from '../@types/astro.js';

export function createEnvSecretsLeakDetectionMiddleware(): MiddlewareHandler {
	return async (context, next) => {
		// TODO:
		// need a envManifest
		// maybe there's a way to pass things from the vite plugin to the manifest?
        // find a way to get public server variables in there
        // update getSecret to be made with createGetSecret, which should accept a schema
		return next();
	};
}
