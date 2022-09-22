import type { SSRResult } from '../../../@types/astro';
import type { AstroComponentFactory } from './index';

import { isHTMLString } from '../escape.js';
import { createResponse } from '../response.js';
import { isAstroComponent, isAstroComponentFactory, renderAstroComponent } from './astro.js';
import { chunkToByteArray, encoder, HTMLParts } from './common.js';
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

export async function renderPage(
	result: SSRResult,
	componentFactory: AstroComponentFactory | NonAstroPageComponent,
	props: any,
	children: any,
	streaming: boolean
): Promise<Response> {
	if (!isAstroComponentFactory(componentFactory)) {
		const pageProps: Record<string, any> = { ...(props ?? {}), 'server:root': true };
		const output = await renderComponent(
			result,
			componentFactory.name,
			componentFactory,
			pageProps,
			null
		);
		let html = output.toString();
		if (!/<!doctype html/i.test(html)) {
			let rest = html;
			html = `<!DOCTYPE html>`;
			// This symbol currently exists for md components, but is something that could
			// be added for any page-level component that's not an Astro component.
			// to signal that head rendering is needed.
			if (nonAstroPageNeedsHeadInjection(componentFactory)) {
				for await (let chunk of maybeRenderHead(result)) {
					html += chunk;
				}
			}
			html += rest;
		}
		const bytes = encoder.encode(html);
		return new Response(bytes, {
			headers: new Headers([
				['Content-Type', 'text/html; charset=utf-8'],
				['Content-Length', bytes.byteLength.toString()],
			]),
		});
	}
	const factoryReturnValue = await componentFactory(result, props, children);

	if (isAstroComponent(factoryReturnValue)) {
		let iterable = renderAstroComponent(factoryReturnValue);
		let init = result.response;
		let headers = new Headers(init.headers);
		let body: BodyInit;

		if (streaming) {
			body = new ReadableStream({
				start(controller) {
					async function read() {
						let i = 0;
						try {
							for await (const chunk of iterable) {
								if (isHTMLString(chunk)) {
									if (i === 0) {
										if (!/<!doctype html/i.test(String(chunk))) {
											controller.enqueue(encoder.encode('<!DOCTYPE html>\n'));
										}
									}
								}

								let bytes = chunkToByteArray(result, chunk);
								controller.enqueue(bytes);
								i++;
							}
							controller.close();
						} catch (e) {
							controller.error(e);
						}
					}
					read();
				},
			});
		} else {
			let parts = new HTMLParts();
			let i = 0;
			for await (const chunk of iterable) {
				if (isHTMLString(chunk)) {
					if (i === 0) {
						if (!/<!doctype html/i.test(String(chunk))) {
							parts.append('<!DOCTYPE html>\n', result);
						}
					}
				}
				parts.append(chunk, result);
				i++;
			}
			body = parts.toArrayBuffer();
			headers.set('Content-Length', body.byteLength.toString());
		}

		let response = createResponse(body, { ...init, headers });
		return response;
	} else {
		return factoryReturnValue;
	}
}
