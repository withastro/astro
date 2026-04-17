import type { RenderContext } from '../render-context.js';
import { routeIsRedirect } from '../routing/helpers.js';
import { renderRedirect } from './render.js';

/**
 * Produces a redirect `Response` for a matched redirect route, or
 * `undefined` if the route is not a redirect.
 *
 * Redirect routes (those with `type: 'redirect'` in the manifest — either
 * an external redirect or a config-declared `redirects` entry) short-circuit
 * the render pipeline. Neither the middleware chain nor the page dispatch
 * run for these routes; they are handled directly by `AstroHandler.render`
 * via this class, before middleware. Callers can invoke `handle()`
 * unconditionally; non-redirect routes return `undefined` synchronously so
 * the caller continues to the normal pipeline without an extra microtask.
 */
export class Redirects {
	handle(renderContext: RenderContext): Promise<Response> | undefined {
		if (!routeIsRedirect(renderContext.routeData)) {
			return undefined;
		}
		return renderRedirect(renderContext);
	}
}
