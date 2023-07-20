import type { RouteData, SSRResult } from '../../../@types/astro';
import type { ComponentIterable } from './component';
import type { AstroComponentFactory } from './index';

import { AstroError } from '../../../core/errors/index.js';
import { isHTMLString } from '../escape.js';
import { createResponse } from '../response.js';
import { isAstroComponentFactory, isAstroComponentInstance } from './astro/index.js';
import { renderToReadableStream, renderToString } from './astro/render.js';
import { HTMLParts, encoder } from './common.js';
import { renderComponent } from './component.js';
import { maybeRenderHead } from './head.js';

const needsHeadRenderingSymbol = Symbol.for('astro.needsHeadRendering');

type NonAstroPageComponent = {
	name: string;
	[needsHeadRenderingSymbol]: boolean;
};

function nonAstroPageNeedsHeadInjection(pageComponent: NonAstroPageComponent): boolean {
	return needsHeadRenderingSymbol in pageComponent && !!pageComponent[needsHeadRenderingSymbol];
}

async function iterableToHTMLBytes(
	result: SSRResult,
	iterable: ComponentIterable,
	onDocTypeInjection?: (parts: HTMLParts) => Promise<void>
): Promise<Uint8Array> {
	const parts = new HTMLParts();
	let i = 0;
	for await (const chunk of iterable) {
		if (isHTMLString(chunk)) {
			if (i === 0) {
				i++;
				if (!/<!doctype html/i.test(String(chunk))) {
					parts.append(`${result.compressHTML ? '<!DOCTYPE html>' : '<!DOCTYPE html>\n'}`, result);
					if (onDocTypeInjection) {
						await onDocTypeInjection(parts);
					}
				}
			}
		}
		parts.append(chunk, result);
	}
	return parts.toArrayBuffer();
}

export async function renderPage(
	result: SSRResult,
	componentFactory: AstroComponentFactory | NonAstroPageComponent,
	props: any,
	children: any,
	streaming: boolean,
	route?: RouteData | undefined
): Promise<Response> {
	if (!isAstroComponentFactory(componentFactory)) {
		result._metadata.headInTree =
			result.componentMetadata.get((componentFactory as any).moduleId)?.containsHead ?? false;
		const pageProps: Record<string, any> = { ...(props ?? {}), 'server:root': true };
		let output: ComponentIterable;
		let head = '';
		try {
			if (nonAstroPageNeedsHeadInjection(componentFactory)) {
				const parts = new HTMLParts();
				for await (const chunk of maybeRenderHead()) {
					parts.append(chunk, result);
				}
				head = parts.toString();
			}

			const renderResult = await renderComponent(
				result,
				componentFactory.name,
				componentFactory,
				pageProps,
				null
			);
			if (isAstroComponentInstance(renderResult)) {
				output = renderResult.render();
			} else {
				output = renderResult;
			}
		} catch (e) {
			if (AstroError.is(e) && !e.loc) {
				e.setLocation({
					file: route?.component,
				});
			}

			throw e;
		}

		// Accumulate the HTML string and append the head if necessary.
		const bytes = await iterableToHTMLBytes(result, output, async (parts) => {
			parts.append(head, result);
		});

		return new Response(bytes, {
			headers: new Headers([
				['Content-Type', 'text/html; charset=utf-8'],
				['Content-Length', bytes.byteLength.toString()],
			]),
		});
	}
	// Mark if this page component contains a <head> within its tree. If it does
	// We avoid implicit head injection entirely.
	result._metadata.headInTree =
		result.componentMetadata.get(componentFactory.moduleId!)?.containsHead ?? false;

	let body: BodyInit | Response;
	if (streaming) {
		body = await renderToReadableStream(result, componentFactory, props, children, true, route);
	} else {
		body = await renderToString(result, componentFactory, props, children, true, route);
	}

	// If the Astro component returns a Response on init, return that response
	if (body instanceof Response) return body;

	// Create final response from body
	const init = result.response;
	const headers = new Headers(init.headers);
	// For non-streaming, convert string to byte array to calculate Content-Length
	if (!streaming && typeof body === 'string') {
		body = encoder.encode(body);
		headers.set('Content-Length', body.byteLength.toString());
	}
	const response = createResponse(body, { ...init, headers });
	return response;
}
