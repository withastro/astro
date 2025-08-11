import { wrapWithTracing } from '../../runtime/server/tracing.js';
import type {
	MiddlewareHandler,
	NamedMiddlewareHandler,
	RewritePayload,
} from '../../types/public/common.js';
import type { APIContext } from '../../types/public/context.js';
import { AstroCookies } from '../cookies/cookies.js';
import { ForbiddenRewrite } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
import { getParams, type Pipeline } from '../render/index.js';
import { apiContextRoutesSymbol } from '../render-context.js';
import { setOriginPathname } from '../routing/rewrite.js';
import { defineMiddleware } from './index.js';

type MiddlewareOrNamed = MiddlewareHandler | NamedMiddlewareHandler;

function wrapMiddlewareWithTracing(name: string, handler: MiddlewareHandler): MiddlewareHandler {
	return wrapWithTracing('middleware', handler, (context) => ({
		name,
		pathname: context.url.pathname,
		url: context.url,
		request: context.request,
	}));
}

// From SvelteKit: https://github.com/sveltejs/kit/blob/master/packages/kit/src/exports/hooks/sequence.js
/**
 *
 * It accepts one or more middleware handlers and makes sure that they are run in sequence.
 */
export function sequence(...handlers: MiddlewareOrNamed[]): MiddlewareHandler {
	const filtered = handlers.filter((h) => !!h && (typeof h === 'function' || !!h[1]));
	const length = filtered.length;
	if (!length) {
		return defineMiddleware((_context, next) => {
			return next();
		});
	}
	if (length === 1) {
		const handler = filtered[0];
		return typeof handler === 'function' ? handler : handler[1];
	}
	const tracedMiddlewares: MiddlewareHandler[] = filtered.map((h, index) =>
		typeof h === 'function'
			? wrapMiddlewareWithTracing(h.name || `sequence[${index}]`, h)
			: wrapMiddlewareWithTracing(h[0] || `sequence[${index}]`, h[1]),
	);
	return defineMiddleware((context, next) => {
		/**
		 * This variable is used to carry the rerouting payload across middleware functions.
		 */
		let carriedPayload: RewritePayload | undefined = undefined;
		return applyHandle(0, context);

		function applyHandle(i: number, handleContext: APIContext) {
			const handle = tracedMiddlewares[i];

			const result = handle(handleContext, async (payload?: RewritePayload): Promise<Response> => {
				if (i < length - 1) {
					if (payload) {
						let newRequest;
						if (payload instanceof Request) {
							newRequest = payload;
						} else if (payload instanceof URL) {
							// Cloning the original request ensures that the new Request gets its own copy of the body stream
							// Without this it will throw an error if they both try to consume the stream, which will happen in a rewrite
							newRequest = new Request(payload, handleContext.request.clone());
						} else {
							newRequest = new Request(
								new URL(payload, handleContext.url.origin),
								handleContext.request.clone(),
							);
						}
						const oldPathname = handleContext.url.pathname;
						const pipeline: Pipeline = Reflect.get(handleContext, apiContextRoutesSymbol);
						const { routeData, pathname } = await pipeline.tryRewrite(
							payload,
							handleContext.request,
						);

						// This is a case where the user tries to rewrite from a SSR route to a prerendered route (SSG).
						// This case isn't valid because when building for SSR, the prerendered route disappears from the server output because it becomes an HTML file,
						// so Astro can't retrieve it from the emitted manifest.
						if (
							pipeline.serverLike === true &&
							handleContext.isPrerendered === false &&
							routeData.prerender === true
						) {
							throw new AstroError({
								...ForbiddenRewrite,
								message: ForbiddenRewrite.message(
									handleContext.url.pathname,
									pathname,
									routeData.component,
								),
								hint: ForbiddenRewrite.hint(routeData.component),
							});
						}

						carriedPayload = payload;
						handleContext.request = newRequest;
						handleContext.url = new URL(newRequest.url);
						handleContext.cookies = new AstroCookies(newRequest);
						handleContext.params = getParams(routeData, pathname);
						handleContext.routePattern = routeData.route;
						setOriginPathname(
							handleContext.request,
							oldPathname,
							pipeline.manifest.trailingSlash,
							pipeline.manifest.buildFormat,
						);
					}

					// @ts-expect-error
					// SAFETY: Usually `next` always returns something in user land, but in `sequence` we are actually
					// doing a loop over all the `next` functions, and eventually we call the last `next` that returns the `Response`.
					return applyHandle(i + 1, handleContext);
				} else {
					return next(payload ?? carriedPayload);
				}
			});
			return result;
		}
	});
}
