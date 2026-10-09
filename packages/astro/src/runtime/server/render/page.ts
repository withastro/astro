import type { RouteData, SSRResult } from '../../../types/public/internal.js';
import { isRoute404, isRoute500 } from '../../../core/routing/internal/route-errors.js';
import { isPropagatingHint } from '../../../core/head-propagation/resolver.js';
import { renderToAsyncIterable, renderToReadableStream, renderToString } from './astro/render.js';
import { encoder } from './common.js';
import { type NonAstroPageComponent, renderComponentToString } from './component.js';
import { renderCspContent } from './csp.js';
import type { AstroComponentFactory } from './index.js';
import { isDeno, isNode, isWorkerd } from './util.js';
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

		const filtered = result._metadata.treeShakeComponents
			? removeUnusedComponentStyles(result, str)
			: str;
		const bytes = encoder.encode(filtered);
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
		// isNode is true in Deno's and workerd's node-compat modes, but their
		// Response constructors do not accept AsyncIterable bodies (a non-standard
		// Node.js extension). Deno falls back to ReadableStream entirely; workerd
		// keeps the faster AsyncIterable render path and wraps the result with
		// ReadableStream.from() so the Response constructor receives a standard type.
		if (isNode && !isDeno) {
			const nodeBody = await renderToAsyncIterable(
				result,
				componentFactory,
				props,
				children,
				true,
				route,
			);
			if (isWorkerd && !(nodeBody instanceof Response)) {
				// ReadableStream.from() is available in Node >= 20.6 and workerd but
				// is not yet in TypeScript's built-in DOM lib types.
				body = (ReadableStream as any).from(nodeBody);
			} else {
				// Node.js allows passing in an AsyncIterable to the Response constructor.
				// This is non-standard so using `any` here to preserve types everywhere else.
				body = nodeBody as any;
			}
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
		if (result._metadata.treeShakeComponents) {
			body = removeUnusedComponentStyles(result, body);
		}
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

/**
 * Removes the `<link>`/`<style>` tags of stylesheets owned exclusively by
 * components that did not render, implementing `experimental.treeShakeComponents`.
 *
 * The head is emitted before the body, so the set of rendered components is only
 * known once the whole page has been rendered. The head renderer records the
 * exact tags it emitted together with their owner component module ids; this
 * runs afterwards, when the response is buffered, and drops the unused ones.
 *
 * Pages with a server island keep every style: the island renders in a separate
 * request, so the components it renders never appear in the page's set of
 * rendered components.
 */
function removeUnusedComponentStyles(result: SSRResult, html: string): string {
	const tags = result._metadata.componentStyleTags;
	if (tags.length === 0) return html;
	if (result._metadata.hasServerIsland) return html;

	const rendered = result._metadata.renderedComponents;
	let output = html;
	for (const { tag, owners } of tags) {
		if (owners.some((owner) => rendered.has(owner))) continue;
		const index = output.indexOf(tag);
		if (index !== -1) {
			output = output.slice(0, index) + output.slice(index + tag.length);
		}
	}
	return output;
}
