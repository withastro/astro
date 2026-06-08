import type { RouteData, SSRResult } from '../../../types/public/internal.js';
import { renderToAsyncIterable, renderToReadableStream, renderToString } from './astro/render.js';
import { encoder } from './common.js';
import { type NonAstroPageComponent, renderComponentToString } from './component.js';
import { markHTMLString } from '../escape.js';
import { renderCspContent } from './csp.js';
import type { AstroComponentFactory } from './index.js';
import { isDeno, isNode } from './util.js';
import { isAstroComponentFactory } from './astro/factory.js';
import { renderStreaming } from './streaming.js';
import { chunkToString } from './common.js';

export async function renderPage(
	result: SSRResult,
	componentFactory: AstroComponentFactory | NonAstroPageComponent,
	props: any,
	children: any,
	streaming: boolean,
	route?: RouteData,
): Promise<Response> {
	if (!isAstroComponentFactory(componentFactory)) {
		result._metadata.headInTree =
			result.componentMetadata.get((componentFactory as any).moduleId)?.containsHead ?? false;

		const pageProps: Record<string, any> = { ...(props ?? {}), 'server:root': true };

		let str: string;

		// MDX and `.html` page components are designed to be invoked directly: MDX
		// returns an `astro:jsx` vnode tree and `.html` returns a ready HTML string,
		// both of which the streaming engine renders. Detect them via their markers
		// (set at compile time) so we never call anything else directly.
		const isHtmlComponent = (componentFactory as any)['astro:html'] === true;
		const isMdxComponent = (componentFactory as any)[Symbol.for('mdx-component')] === true;

		if (isHtmlComponent || isMdxComponent) {
			let vnode = await (componentFactory as any)(pageProps);

			// .html pages return plain strings that are already valid HTML.
			// Mark them as safe HTML so the engine doesn't escape the content.
			if (isHtmlComponent && typeof vnode === 'string') {
				vnode = markHTMLString(vnode);
			}

			let html = '';
			let renderedFirst = false;
			const destination = {
				write(chunk: any) {
					if (chunk instanceof Response) return;

					// Add doctype if this is the first chunk and it doesn't already have one
					if (!renderedFirst && !result.partial) {
						renderedFirst = true;
						const chunkStr = String(chunk);
						if (!/<!doctype html/i.test(chunkStr)) {
							const doctype = result.compressHTML ? '<!DOCTYPE html>' : '<!DOCTYPE html>\n';
							html += doctype;
						}
					}

					html += chunkToString(result, chunk);
				},
			};
			await renderStreaming(vnode, result, destination);
			str = html;
		} else {
			// Any other component reaching here — e.g. a framework component rendered
			// through the Container API — must go through `renderComponent`, which
			// dispatches to the right framework SSR renderer. Calling such a component
			// directly would be incorrect (and would throw for hooks-based renderers).
			str = await renderComponentToString(
				result,
				(componentFactory as NonAstroPageComponent).name,
				componentFactory,
				pageProps,
				{},
				true,
				route,
			);
		}

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
	result._metadata.headInTree =
		result.componentMetadata.get(componentFactory.moduleId!)?.containsHead ?? false;

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
	// Custom 404.astro and 500.astro are particular routes that must return a fixed status code
	if (route?.route === '/404') {
		status = 404;
		if (statusText === 'OK') {
			statusText = 'Not Found';
		}
	} else if (route?.route === '/500') {
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
