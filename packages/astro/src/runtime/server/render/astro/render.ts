import { AstroError, AstroErrorData } from '../../../../core/errors/index.js';
import type { RouteData, SSRResult } from '../../../../types/public/internal.js';
import { isPromise } from '../../util.js';
import {
	chunkToByteArray,
	chunkToByteArrayOrString,
	chunkToString,
	encoder,
	type RenderDestination,
} from '../common.js';
import { promiseWithResolvers } from '../util.js';
import { bufferPropagatedHead } from '../head-propagation/runtime.js';
import { renderStreaming } from '../streaming.js';
import type { AstroComponentFactory } from './factory.js';
import { isHeadAndContent } from './head-and-content.js';
import { isRenderTemplateResult } from './render-template.js';

const DOCTYPE_EXP = /<!doctype html/i;

/**
 * Renders a component tree to a string using the streaming engine.
 */
async function renderStreamToString(
	result: SSRResult,
	templateResult: any,
	isPage: boolean,
): Promise<string> {
	let str = '';
	let renderedFirstPageChunk = false;

	// Buffer propagated head content (and run `propagation: 'self'` components,
	// e.g. server islands) before rendering, so response headers set during
	// their initialization are applied before the body is produced.
	if (isPage) {
		await bufferHeadContent(result);
	}

	const destination: RenderDestination = {
		write(chunk) {
			// Automatic doctype insertion for pages
			if (isPage && !renderedFirstPageChunk) {
				renderedFirstPageChunk = true;
				if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
					const doctype = result.compressHTML ? '<!DOCTYPE html>' : '<!DOCTYPE html>\n';
					str += doctype;
				}
			}

			// `renderToString` doesn't work with emitting responses, so ignore here
			if (chunk instanceof Response) return;

			str += chunkToString(result, chunk);
		},
	};

	await renderStreaming(templateResult, result, destination);

	return str;
}

/**
 * Renders a component tree to a `ReadableStream` using the streaming engine.
 */
async function renderStreamToStream(
	result: SSRResult,
	templateResult: any,
	isPage: boolean,
	route?: RouteData,
): Promise<ReadableStream> {
	let renderedFirstPageChunk = false;

	// Buffer propagated head content (and run `propagation: 'self'` components,
	// e.g. server islands) before constructing the stream, so response headers
	// set during their initialization are applied before the response is sent.
	if (isPage) {
		await bufferHeadContent(result);
	}

	return new ReadableStream({
		start(controller) {
			const destination: RenderDestination = {
				write(chunk) {
					// Automatic doctype insertion for pages
					if (isPage && !renderedFirstPageChunk) {
						renderedFirstPageChunk = true;
						if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
							const doctype = result.compressHTML ? '<!DOCTYPE html>' : '<!DOCTYPE html>\n';
							controller.enqueue(encoder.encode(doctype));
						}
					}

					// `chunk` might be a Response that contains a redirect,
					// that was rendered eagerly and therefore bypassed the early check
					// whether headers can still be modified. In that case, throw an error
					if (chunk instanceof Response) {
						throw new AstroError({
							...AstroErrorData.ResponseSentError,
						});
					}

					const bytes = chunkToByteArray(result, chunk);
					controller.enqueue(bytes);
				},
			};

			(async () => {
				try {
					await renderStreaming(templateResult, result, destination);
					controller.close();
				} catch (e) {
					// We don't have a lot of information downstream, and upstream we can't catch the error properly
					// So let's add the location here
					if (AstroError.is(e) && !e.loc) {
						e.setLocation({
							file: route?.component,
						});
					}

					// Report the error on the next microtask, so the chunks already written synchronously flush first
					setTimeout(() => controller.error(e), 0);
				}
			})();
		},
		cancel() {
			// If the client disconnects,
			// we signal to ignore the results of existing renders and avoid kicking off more of them.
			result.cancelled = true;
		},
	});
}

/**
 * Renders a component tree to an `AsyncIterable` using the streaming engine.
 */
async function renderStreamToAsyncIterable(
	result: SSRResult,
	templateResult: any,
	isPage: boolean,
	_route?: RouteData,
): Promise<AsyncIterable<Uint8Array>> {
	let renderedFirstPageChunk = false;
	let error: Error | null = null;
	let next: ReturnType<typeof promiseWithResolvers<void>> | null = null;
	const buffer: Array<Uint8Array | string> = [];
	let renderingComplete = false;

	// Buffer propagated head content (and run `propagation: 'self'` components,
	// e.g. server islands) before producing the iterable, so response headers
	// set during their initialization are applied before the response is sent.
	if (isPage) {
		await bufferHeadContent(result);
	}

	const iterator: AsyncIterator<Uint8Array> = {
		async next() {
			if (result.cancelled) return { done: true, value: undefined };

			if (next !== null) {
				await next.promise;
			} else if (!renderingComplete && !buffer.length) {
				next = promiseWithResolvers();
				await next.promise;
			}

			if (!renderingComplete) {
				next = promiseWithResolvers();
			}

			if (error) {
				throw error;
			}

			// Merge buffer into single Uint8Array
			let length = 0;
			let stringToEncode = '';
			for (let i = 0, len = buffer.length; i < len; i++) {
				const bufferEntry = buffer[i];

				if (typeof bufferEntry === 'string') {
					const nextIsString = i + 1 < len && typeof buffer[i + 1] === 'string';
					stringToEncode += bufferEntry;
					if (!nextIsString) {
						const encoded = encoder.encode(stringToEncode);
						length += encoded.length;
						stringToEncode = '';
						buffer[i] = encoded;
					} else {
						buffer[i] = '';
					}
				} else {
					length += bufferEntry.length;
				}
			}

			const mergedArray = new Uint8Array(length);
			let offset = 0;
			for (let i = 0, len = buffer.length; i < len; i++) {
				const item = buffer[i];
				if (item === '') {
					continue;
				}
				mergedArray.set(item as Uint8Array, offset);
				offset += (item as Uint8Array).length;
			}

			buffer.length = 0;

			const returnValue = {
				done: length === 0 && renderingComplete,
				value: mergedArray,
			};

			return returnValue;
		},
		async return() {
			result.cancelled = true;
			return { done: true, value: undefined };
		},
	};

	const destination: RenderDestination = {
		write(chunk) {
			if (isPage && !renderedFirstPageChunk) {
				renderedFirstPageChunk = true;
				if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
					const doctype = result.compressHTML ? '<!DOCTYPE html>' : '<!DOCTYPE html>\n';
					buffer.push(encoder.encode(doctype));
				}
			}
			if (chunk instanceof Response) {
				throw new AstroError(AstroErrorData.ResponseSentError);
			}
			const bytes = chunkToByteArrayOrString(result, chunk);
			if (bytes.length > 0) {
				buffer.push(bytes);
				next?.resolve();
			} else if (buffer.length > 0) {
				next?.resolve();
			}
		},
	};

	const renderResult = toPromise(() => renderStreaming(templateResult, result, destination));

	renderResult
		.catch((err) => {
			error = err;
		})
		.finally(() => {
			renderingComplete = true;
			next?.resolve();
		});

	return {
		[Symbol.asyncIterator]() {
			return iterator;
		},
	};
}

// Calls a component and renders it into a string of HTML
export async function renderToString(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any,
	isPage = false,
	route?: RouteData,
): Promise<string | Response> {
	const templateResult = await callComponentAsTemplateResultOrResponse(
		result,
		componentFactory,
		props,
		children,
		route,
	);

	// If the Astro component returns a Response on init, return that response
	if (templateResult instanceof Response) return templateResult;

	return await renderStreamToString(result, templateResult, isPage);
}

// Calls a component and renders it into a readable stream
export async function renderToReadableStream(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any,
	isPage = false,
	route?: RouteData,
): Promise<ReadableStream | Response> {
	const templateResult = await callComponentAsTemplateResultOrResponse(
		result,
		componentFactory,
		props,
		children,
		route,
	);

	// If the Astro component returns a Response on init, return that response
	if (templateResult instanceof Response) return templateResult;

	return await renderStreamToStream(result, templateResult, isPage, route);
}

async function callComponentAsTemplateResultOrResponse(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any,
	route?: RouteData,
) {
	const factoryResult = await componentFactory(result, props, children);

	if (factoryResult instanceof Response) {
		return factoryResult;
	}
	// we check if the component we attempt to render is a head+content
	else if (isHeadAndContent(factoryResult)) {
		// we make sure that content is valid template result
		if (!isRenderTemplateResult(factoryResult.content)) {
			throw new AstroError({
				...AstroErrorData.OnlyResponseCanBeReturned,
				message: AstroErrorData.OnlyResponseCanBeReturned.message(
					route?.route,
					typeof factoryResult,
				),
				location: {
					file: route?.component,
				},
			});
		}

		// return the content
		return factoryResult.content;
	} else if (!isRenderTemplateResult(factoryResult)) {
		throw new AstroError({
			...AstroErrorData.OnlyResponseCanBeReturned,
			message: AstroErrorData.OnlyResponseCanBeReturned.message(route?.route, typeof factoryResult),
			location: {
				file: route?.component,
			},
		});
	}

	return factoryResult;
}

// Recursively calls component instances that might have head content
// to be propagated up.
export async function bufferHeadContent(result: SSRResult) {
	await bufferPropagatedHead(result);
}

export async function renderToAsyncIterable(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any,
	isPage = false,
	route?: RouteData,
): Promise<AsyncIterable<Uint8Array> | Response> {
	const templateResult = await callComponentAsTemplateResultOrResponse(
		result,
		componentFactory,
		props,
		children,
		route,
	);
	if (templateResult instanceof Response) return templateResult;

	return await renderStreamToAsyncIterable(result, templateResult, isPage, route);
}

function toPromise<T>(fn: () => T | Promise<T>): Promise<T> {
	try {
		const result = fn();
		return isPromise(result) ? result : Promise.resolve(result);
	} catch (err) {
		return Promise.reject(err);
	}
}
