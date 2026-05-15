import { AstroError, AstroErrorData } from '../../../../core/errors/index.js';
import { isPromise } from '../../util.js';
import { chunkToByteArray, chunkToByteArrayOrString, chunkToString, encoder } from '../common.js';
import { promiseWithResolvers } from '../util.js';
import { bufferPropagatedHead } from '../head-propagation/runtime.js';
import { isHeadAndContent } from './head-and-content.js';
import { isRenderTemplateResult } from './render-template.js';
const DOCTYPE_EXP = /<!doctype html/i;
async function renderToString(result, componentFactory, props, children, isPage = false, route) {
	const templateResult = await callComponentAsTemplateResultOrResponse(
		result,
		componentFactory,
		props,
		children,
		route,
	);
	if (templateResult instanceof Response) return templateResult;
	let str = '';
	let renderedFirstPageChunk = false;
	if (isPage) {
		await bufferHeadContent(result);
	}
	const destination = {
		write(chunk) {
			if (isPage && !renderedFirstPageChunk) {
				renderedFirstPageChunk = true;
				if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
					const doctype = result.compressHTML ? '<!DOCTYPE html>' : '<!DOCTYPE html>\n';
					str += doctype;
				}
			}
			if (chunk instanceof Response) return;
			str += chunkToString(result, chunk);
		},
	};
	await templateResult.render(destination);
	return str;
}
async function renderToReadableStream(
	result,
	componentFactory,
	props,
	children,
	isPage = false,
	route,
) {
	const templateResult = await callComponentAsTemplateResultOrResponse(
		result,
		componentFactory,
		props,
		children,
		route,
	);
	if (templateResult instanceof Response) return templateResult;
	let renderedFirstPageChunk = false;
	if (isPage) {
		await bufferHeadContent(result);
	}
	return new ReadableStream({
		start(controller) {
			const destination = {
				write(chunk) {
					if (isPage && !renderedFirstPageChunk) {
						renderedFirstPageChunk = true;
						if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
							const doctype = result.compressHTML ? '<!DOCTYPE html>' : '<!DOCTYPE html>\n';
							controller.enqueue(encoder.encode(doctype));
						}
					}
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
					await templateResult.render(destination);
					controller.close();
				} catch (e) {
					if (AstroError.is(e) && !e.loc) {
						e.setLocation({
							file: route?.component,
						});
					}
					setTimeout(() => controller.error(e), 0);
				}
			})();
		},
		cancel() {
			result.cancelled = true;
		},
	});
}
async function callComponentAsTemplateResultOrResponse(
	result,
	componentFactory,
	props,
	children,
	route,
) {
	const factoryResult = await componentFactory(result, props, children);
	if (factoryResult instanceof Response) {
		return factoryResult;
	} else if (isHeadAndContent(factoryResult)) {
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
async function bufferHeadContent(result) {
	await bufferPropagatedHead(result);
}
async function renderToAsyncIterable(
	result,
	componentFactory,
	props,
	children,
	isPage = false,
	route,
) {
	const templateResult = await callComponentAsTemplateResultOrResponse(
		result,
		componentFactory,
		props,
		children,
		route,
	);
	if (templateResult instanceof Response) return templateResult;
	let renderedFirstPageChunk = false;
	if (isPage) {
		await bufferHeadContent(result);
	}
	let error = null;
	let next = null;
	const buffer = [];
	let renderingComplete = false;
	const iterator = {
		async next() {
			if (result.cancelled) return { done: true, value: void 0 };
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
			let mergedArray = new Uint8Array(length);
			let offset = 0;
			for (let i = 0, len = buffer.length; i < len; i++) {
				const item = buffer[i];
				if (item === '') {
					continue;
				}
				mergedArray.set(item, offset);
				offset += item.length;
			}
			buffer.length = 0;
			const returnValue = {
				// The iterator is done when rendering has finished
				// and there are no more chunks to return.
				done: length === 0 && renderingComplete,
				value: mergedArray,
			};
			return returnValue;
		},
		async return() {
			result.cancelled = true;
			return { done: true, value: void 0 };
		},
	};
	const destination = {
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
	const renderResult = toPromise(() => templateResult.render(destination));
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
function toPromise(fn) {
	try {
		const result = fn();
		return isPromise(result) ? result : Promise.resolve(result);
	} catch (err) {
		return Promise.reject(err);
	}
}
export { bufferHeadContent, renderToAsyncIterable, renderToReadableStream, renderToString };
