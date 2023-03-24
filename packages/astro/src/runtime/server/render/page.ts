import type { RouteData, SSRResult } from '../../../@types/astro';
import type { ComponentIterable } from './component';
import type { AstroComponentFactory } from './index';

import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import { isHTMLString } from '../escape.js';
import { createResponse } from '../response.js';
import {
	isAstroComponentFactory,
	isAstroComponentInstance,
	isHeadAndContent,
	isRenderTemplateResult,
	renderAstroTemplateResult,
} from './astro/index.js';
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
					parts.append('<!DOCTYPE html>\n', result);
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

// Recursively calls component instances that might have head content
// to be propagated up.
async function bufferHeadContent(result: SSRResult) {
	const iterator = result.propagators.values();
	while (true) {
		const { value, done } = iterator.next();
		if (done) {
			break;
		}
		const returnValue = await value.init(result);
		if (isHeadAndContent(returnValue)) {
			result.extraHead.push(returnValue.head);
		}
	}
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
		const pageProps: Record<string, any> = { ...(props ?? {}), 'server:root': true };

		let output: ComponentIterable;
		let head = '';
		try {
			if (nonAstroPageNeedsHeadInjection(componentFactory)) {
				const parts = new HTMLParts();
				for await (const chunk of maybeRenderHead(result)) {
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
	const factoryReturnValue = await componentFactory(result, props, children);
	const factoryIsHeadAndContent = isHeadAndContent(factoryReturnValue);
	if (isRenderTemplateResult(factoryReturnValue) || factoryIsHeadAndContent) {
		// Wait for head content to be buffered up
		await bufferHeadContent(result);
		const templateResult = factoryIsHeadAndContent
			? factoryReturnValue.content
			: factoryReturnValue;

		let iterable = renderAstroTemplateResult(templateResult);
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

								const bytes = chunkToByteArray(result, chunk);
								controller.enqueue(bytes);
								i++;
							}
							controller.close();
						} catch (e) {
							// We don't have a lot of information downstream, and upstream we can't catch the error properly
							// So let's add the location here
							if (AstroError.is(e) && !e.loc) {
								e.setLocation({
									file: route?.component,
								});
							}

							controller.error(e);
						}
					}
					read();
				},
			});
		} else {
			body = await iterableToHTMLBytes(result, iterable);
			headers.set('Content-Length', body.byteLength.toString());
		}

		let response = createResponse(body, { ...init, headers });
		return response;
	}

	// We double check if the file return a Response
	if (!(factoryReturnValue instanceof Response)) {
		throw new AstroError({
			...AstroErrorData.OnlyResponseCanBeReturned,
			message: AstroErrorData.OnlyResponseCanBeReturned.message(
				route?.route,
				typeof factoryReturnValue
			),
			location: {
				file: route?.component,
			},
		});
	}

	return factoryReturnValue;
}
