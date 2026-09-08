import type { RouteData, SSRResult } from '../../../types/public/internal.js';
import { isRoute404, isRoute500 } from '../../../core/routing/internal/route-errors.js';
import { isPropagatingHint } from '../../../core/head-propagation/resolver.js';
import { renderToAsyncIterable, renderToReadableStream, renderToString } from './astro/render.js';
import { encoder } from './common.js';
import { type NonAstroPageComponent, renderComponentToString } from './component.js';
import { renderCspContent } from './csp.js';
import type { AstroComponentFactory } from './index.js';
import { isDeno, isNode } from './util.js';
import { isAstroComponentFactory } from './astro/factory.js';

export async function renderPage(
	result: SSRResult,
	componentFactory: AstroComponentFactory | NonAstroPageComponent,
	props: any,
	children: any,
	streaming: boolean,
	route?: RouteData,
): Promise<Response> {
	if (!isAstroComponentFactory(componentFactory)) {
		const nonAstroMeta = result.componentMetadata.get((componentFactory as any).moduleId);
		result._metadata.headInTree = nonAstroMeta?.containsHead ?? false;
		result._metadata.routeHasPropagation = isPropagatingHint(nonAstroMeta?.propagation ?? 'none');

		const pageProps: Record<string, any> = { ...(props ?? {}), 'server:root': true };

		// Non-Astro page components (MDX, `.html`, and raw framework components
		// rendered through the Container API) go through `renderComponentToString`,
		// which dispatches to the correct renderer: the `astro:jsx` renderer for
		// MDX (which also wraps runtime errors with a helpful hint and streams the
		// content), the HTML renderer for `.html`, and framework renderers for
		// components. It also injects the `<head>` for layout-less MDX pages.
		const str = await renderComponentToString(
			result,
			(componentFactory as NonAstroPageComponent).name,
			componentFactory,
			pageProps,
			{},
			true,
			route,
		);

		const bytes = encoder.encode(str);
		const headers = new Headers([
			['Content-Type', 'text/html'],
			['Content-Length', bytes.byteLength.toString()],
		]);
		if (
			result.shouldInjectCspMetaTags &&
			(result.cspDestination === 'header' || result.cspDestination === 'adapter')
		) {
			headers.set('content-security-policy', renderCspContent(result));
		}

		return new Response(bytes, {
			headers,
			status: result.response.status,
		});
	}

	// Mark if this page component contains a <head> within its tree. If it does
	// We avoid implicit head injection entirely.
	const pageMeta = result.componentMetadata.get(componentFactory.moduleId!);
	result._metadata.headInTree = pageMeta?.containsHead ?? false;
	// Only routes on a propagation path need to await async slot pre-renders
	// before flushing the head (see `collectPropagatedHeadParts`). Other routes
	// keep streaming without blocking the head on unrelated markup `await`s.
	result._metadata.routeHasPropagation = isPropagatingHint(pageMeta?.propagation ?? 'none');

	let body: BodyInit | Response;
	if (streaming) {
		// isNode is true in Deno node-compat mode but response construction from
		// async iterables is not supported, so we fall back to ReadableStream if isDeno is true.
		if (isNode && !isDeno) {
			const nodeBody = await renderToAsyncIterable(
				result,
				componentFactory,
				props,
				children,
				true,
				route,
			);
			// Node.js allows passing in an AsyncIterable to the Response constructor.
			// This is non-standard so using `any` here to preserve types everywhere else.
			body = nodeBody as any;
		} else {
			body = await renderToReadableStream(result, componentFactory, props, children, true, route);
		}
	} else {
		body = await renderToString(result, componentFactory, props, children, true, route);
	}

	// If the Astro component returns a Response on init, return that response
	if (body instanceof Response) return body;

	// Create final response from body
	const init = result.response;
	const headers = new Headers(init.headers);
	if (
		(result.shouldInjectCspMetaTags && result.cspDestination === 'header') ||
		result.cspDestination === 'adapter'
	) {
		headers.set('content-security-policy', renderCspContent(result));
	}

	// For non-streaming, convert string to byte array to calculate Content-Length
	if (!streaming && typeof body === 'string') {
		body = encoder.encode(body);
		headers.set('Content-Length', body.byteLength.toString());
	}
	let status = init.status;
	let statusText = init.statusText;
	// Custom root 404.astro and 500.astro routes must return fixed status codes.
	if (route?.route && isRoute404(route.route)) {
		status = 404;
		if (statusText === 'OK') {
			statusText = 'Not Found';
		}
	} else if (route?.route && isRoute500(route.route)) {
		status = 500;
		if (statusText === 'OK') {
			statusText = 'Internal Server Error';
		}
	}

	if (status) {
		return new Response(body, { ...init, headers, status, statusText });
	} else {
		return new Response(body, { ...init, headers });
	}
}
