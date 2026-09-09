import type { APIRoute } from 'astro';
// Eagerly import every module containing server functions so their
// registrations exist before dispatch. Required in dev — functions referenced
// only by client code are never loaded by the SSR render itself; in builds
// the handler virtual already inlines the same manifest (the import dedupes).
import 'virtual:solid-server-function-manifest';
import { handleServerFunctionRequest } from 'virtual:solid-server-function-handler';

export const prerender = false;

// The transport addresses functions as `<endpoint>/<id>` (or
// `<endpoint>/data/<id>` for the scripted transport); this route is injected
// at `<endpoint>/[...] ` by the integration. Dispatching through an injected
// Astro route (instead of a raw Vite middleware) means server-function
// requests flow through Astro's middleware pipeline — the same auth guards
// and locals decoration pages get — in dev and production alike.
export const ALL: APIRoute = (context) => {
	let request = context.request;
	// Node-to-web request conversions attach a body stream to every POST,
	// including bodyless ones (zero-argument calls send `Content-Length: 0`),
	// but the runtime reads "no arguments" from `request.body === null`.
	// Rebuild the empty case so it parses as a zero-argument call.
	if (request.body !== null && request.headers.get('content-length') === '0') {
		request = new Request(request.url, { method: request.method, headers: request.headers });
	}
	return handleServerFunctionRequest(request, {
		// Extends the Solid request event (`getRequestEvent()`): Astro's
		// per-request locals, plus the full API context as the platform event.
		event: { locals: context.locals, nativeEvent: context },
	});
};
