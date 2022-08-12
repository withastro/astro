import type { SSRResult } from '../../../@types/astro';
import type { AstroComponentFactory } from './index';

import { createResponse } from '../response.js';
import { isAstroComponent, renderAstroComponent } from './astro.js';
import { stringifyChunk } from './common.js';
import { renderComponent } from './component.js';
import { maybeRenderHead } from './head.js';

const encoder = new TextEncoder();

export async function renderPage(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any,
	streaming: boolean
): Promise<Response> {
	if (!componentFactory.isAstroComponentFactory) {
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
			for await (let chunk of maybeRenderHead(result)) {
				html += chunk;
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

		// Combines HTML chunks coming from the iterable with rendering instructions
		// added to metadata. These instructions need to go out first to ensure
		// the scripts exist before the islands that need them.
		async function* eachChunk() {
			for await (const chunk of iterable) {
				if (result._metadata.pendingInstructions.size) {
					for (const instr of result._metadata.pendingInstructions) {
						result._metadata.pendingInstructions.delete(instr);
						yield instr;
					}
				}
				yield chunk;
			}
		}

		if (streaming) {
			body = new ReadableStream({
				start(controller) {
					async function read() {
						let i = 0;
						try {
							for await (const chunk of eachChunk()) {
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
			for await (const chunk of eachChunk()) {
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
