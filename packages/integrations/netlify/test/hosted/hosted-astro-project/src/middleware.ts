import https from 'node:https';

// @ts-expect-error: Parameter `context` implicitly has an any type
export const onRequest = (context, next) => {
	console.info(context.netlify);
	context.locals.middleware = context?.locals?.netlify?.context?.geo?.country?.code ?? null;
	context.locals.runtime = 'Deno' in globalThis ? 'Deno' : 'Node';
	context.locals.title = 'Middleware';
	context.locals.nodePrefixedImportExists = !!https;

	return next();
};
