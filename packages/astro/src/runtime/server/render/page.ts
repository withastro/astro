import type { SSRResult } from '../../../@types/astro';
import type { AstroComponentFactory } from './index';

import { createResponse } from '../response.js';
import { isAstroComponent, isAstroComponentFactory, renderAstroComponent } from './astro.js';
import { stringifyChunk } from './common.js';
import { renderComponent } from './component.js';
import { maybeRenderHead } from './head.js';

const encoder = new TextEncoder();
const needsHeadRenderingSymbol =  Symbol.for('astro.needsHeadRendering');

type NonAstroPageComponent = {
	name: string;
	[needsHeadRenderingSymbol]: boolean;
};

function nonAstroPageNeedsHeadInjection(pageComponent: NonAstroPageComponent): boolean {
	return (
		(needsHeadRenderingSymbol in pageComponent) &&
		!!pageComponent[needsHeadRenderingSymbol]
	);
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
			if(nonAstroPageNeedsHeadInjection(componentFactory)) {
				for await (let chunk of maybeRenderHead(result)) {
					html += chunk;
				}
			}
			html += rest;
		}
		return new Response(html, {
			headers: new Headers([
				['Content-Type', 'text/html; charset=utf-8'],
				['Content-Length', Buffer.byteLength(html, 'utf-8').toString()],
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
								let html = stringifyChunk(result, chunk);

								if (i === 0) {
									if (!/<!doctype html/i.test(html)) {
										controller.enqueue(encoder.encode('<!DOCTYPE html>\n'));
									}
								}
								controller.enqueue(encoder.encode(html));
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
			body = '';
			let i = 0;
			for await (const chunk of iterable) {
				let html = stringifyChunk(result, chunk);
				if (i === 0) {
					if (!/<!doctype html/i.test(html)) {
						body += '<!DOCTYPE html>\n';
					}
				}
				body += html;
				i++;
			}
			const bytes = encoder.encode(body);
			headers.set('Content-Length', bytes.byteLength.toString());
		}

		let response = createResponse(body, { ...init, headers });
		return response;
	} else {
		return factoryReturnValue;
	}
}
