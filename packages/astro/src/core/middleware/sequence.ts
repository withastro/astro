import type { MiddlewareHandler, RewritePayload } from '../../types/public/common.js';
import type { APIContext } from '../../types/public/context.js';
import { fetchStateSymbol } from '../constants.js';
import { getEnvironment } from '../environment/index.js';
import { ForbiddenRewrite } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
// The FetchState import is type-only (the symbol is read directly off the
// context) so this module has no runtime dependency on the fetch-state
// module, which sits on the other side of the middleware import cycle.
import type { FetchState } from '../fetch/fetch-state.js';
import { getParams } from '../render/params-and-props.js';
import { copyRequest, setOriginPathname } from '../routing/rewrite.js';
import { defineMiddleware } from './defineMiddleware.js';

// From SvelteKit: https://github.com/sveltejs/kit/blob/master/packages/kit/src/exports/hooks/sequence.js
/**
 *
 * It accepts one or more middleware handlers and makes sure that they are run in sequence.
 */
export function sequence(...handlers: MiddlewareHandler[]): MiddlewareHandler {
	const filtered = handlers.filter((h) => !!h);
	const length = filtered.length;
	if (!length) {
		return defineMiddleware((_context, next) => {
			return next();
		});
	}
	return defineMiddleware((context, next) => {
		/**
		 * This variable is used to carry the rerouting payload across middleware functions.
		 */
		let carriedPayload: RewritePayload | undefined = undefined;
		return applyHandle(0, context);

		function applyHandle(i: number, handleContext: APIContext) {
			const handle = filtered[i];
			// @ts-expect-error
			// SAFETY: Usually `next` always returns something in user land, but in `sequence` we are actually
			// doing a loop over all the `next` functions, and eventually we call the last `next` that returns the `Response`.
			const result = handle(handleContext, async (payload?: RewritePayload) => {
				if (i < length - 1) {
					if (payload) {
						const oldPathname = handleContext.url.pathname;
						const state = Reflect.get(handleContext, fetchStateSymbol) as FetchState | undefined;
						if (!state) {
							// Outside Astro's request pipeline the state is never stamped.
							throw new Error(
								"FetchState not found on APIContext. `next(payload)` rewrites require a context created through Astro's request pipeline.",
							);
						}
						const manifest = state.manifest;
						const { routeData, pathname } = await getEnvironment(manifest).tryRewrite(
							manifest,
							payload,
							handleContext.request,
						);
						let newRequest: Request;
						if (payload instanceof Request) {
							newRequest = payload;
						} else {
							const request =
								handleContext.request.method === 'GET' || handleContext.request.method === 'HEAD'
									? handleContext.request
									: handleContext.request.clone();
							const newUrl =
								payload instanceof URL ? payload : new URL(payload, handleContext.url.origin);
							newRequest = copyRequest(newUrl, request, false, state.logger, routeData.route);
						}

						// This is a case where the user tries to rewrite from a SSR route to a prerendered route (SSG).
						// This case isn't valid because when building for SSR, the prerendered route disappears from the server output because it becomes an HTML file,
						// so Astro can't retrieve it from the emitted manifest.
						if (
							manifest.serverLike === true &&
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
						handleContext.params = getParams(routeData, pathname);
						handleContext.routePattern = routeData.route;
						setOriginPathname(
							handleContext.request,
							oldPathname,
							manifest.trailingSlash,
							manifest.buildFormat,
						);
					}
					return applyHandle(i + 1, handleContext);
				} else {
					return next(payload ?? carriedPayload);
				}
			});
			return result;
		}
	});
}
