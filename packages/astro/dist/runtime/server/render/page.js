import { renderToAsyncIterable, renderToReadableStream, renderToString } from './astro/render.js';
import { encoder } from './common.js';
import { renderComponentToString } from './component.js';
import { markHTMLString } from '../escape.js';
import { renderCspContent } from './csp.js';
import { isDeno, isNode } from './util.js';
import { isAstroComponentFactory } from './astro/factory.js';
import { buildRenderQueue } from './queue/builder.js';
import { renderQueue } from './queue/renderer.js';
import { chunkToString } from './common.js';
async function renderPage(result, componentFactory, props, children, streaming, route) {
	if (!isAstroComponentFactory(componentFactory)) {
		result._metadata.headInTree =
			result.componentMetadata.get(componentFactory.moduleId)?.containsHead ?? false;
		const pageProps = { ...(props ?? {}), 'server:root': true };
		let str;
		if (result._experimentalQueuedRendering && result._experimentalQueuedRendering.enabled) {
			let vnode = await componentFactory(pageProps);
			if (componentFactory['astro:html'] && typeof vnode === 'string') {
				vnode = markHTMLString(vnode);
			}
			const queue = await buildRenderQueue(vnode, result, result._experimentalQueuedRendering.pool);
			let html = '';
			let renderedFirst = false;
			const destination = {
				write(chunk) {
					if (chunk instanceof Response) return;
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
			await renderQueue(queue, destination);
			str = html;
		} else {
			str = await renderComponentToString(
				result,
				componentFactory.name,
				componentFactory,
				pageProps,
				{},
				true,
				route,
			);
		}
		const bytes = encoder.encode(str);
		const headers2 = new Headers([
			['Content-Type', 'text/html'],
			['Content-Length', bytes.byteLength.toString()],
		]);
		if (
			result.shouldInjectCspMetaTags &&
			(result.cspDestination === 'header' || result.cspDestination === 'adapter')
		) {
			headers2.set('content-security-policy', renderCspContent(result));
		}
		return new Response(bytes, {
			headers: headers2,
			status: result.response.status,
		});
	}
	result._metadata.headInTree =
		result.componentMetadata.get(componentFactory.moduleId)?.containsHead ?? false;
	let body;
	if (streaming) {
		if (isNode && !isDeno) {
			const nodeBody = await renderToAsyncIterable(
				result,
				componentFactory,
				props,
				children,
				true,
				route,
			);
			body = nodeBody;
		} else {
			body = await renderToReadableStream(result, componentFactory, props, children, true, route);
		}
	} else {
		body = await renderToString(result, componentFactory, props, children, true, route);
	}
	if (body instanceof Response) return body;
	const init = result.response;
	const headers = new Headers(init.headers);
	if (
		(result.shouldInjectCspMetaTags && result.cspDestination === 'header') ||
		result.cspDestination === 'adapter'
	) {
		headers.set('content-security-policy', renderCspContent(result));
	}
	if (!streaming && typeof body === 'string') {
		body = encoder.encode(body);
		headers.set('Content-Length', body.byteLength.toString());
	}
	let status = init.status;
	let statusText = init.statusText;
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
export { renderPage };
