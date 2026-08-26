import { getEntry } from 'astro:content';
import { defineMiddleware } from 'astro:middleware';

// Module scope: this runs when the middleware entrypoint is first imported, not
// inside a request. `getEntry()` logs its "entry not found" warning through the
// logger `astro:content` was built with, so having no request state to carry a
// logger does not send the warning to the console.
await getEntry('blog', 'missing-at-module-scope');

export const onRequest = defineMiddleware(async (_context, next) => {
	// Request scope, for contrast: same logger, reached the same way.
	await getEntry('blog', 'missing-in-handler');
	return next();
});
