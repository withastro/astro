import { AstroError, AstroErrorData } from '../../../../core/errors/index.js';
import type { RouteData, SSRResult } from '../../../../types/public/internal.js';
import { isPromise } from '../../util.js';
import {
	chunkToByteArray,
	chunkToByteArrayOrString,
	chunkToString,
	encoder,
	type RenderDestination,
	stringifyChunk,
} from '../common.js';
import { promiseWithResolvers } from '../util.js';
import type { AstroComponentFactory } from './factory.js';
import { isHeadAndContent } from './head-and-content.js';
import { isRenderTemplateResult } from './render-template.js';

const DOCTYPE_EXP = /<!doctype html/i;

// Calls a component and renders it into a string.
// Used by the container API.
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

	let str = '';
	let renderedFirstPageChunk = false;

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

	await templateResult.render(destination);

	return str;
}

// Renders a component directly into a Uint8Array buffer.
// Avoids the decode→string-concat→encode round-trip that renderToString incurs
// when RenderBytesResult writes pre-encoded Uint8Array static parts.
// Used by page.ts for non-streaming Astro component rendering.
export async function renderToBuffer(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any,
	isPage = false,
	route?: RouteData,
): Promise<Uint8Array | Response> {
	const templateResult = await callComponentAsTemplateResultOrResponse(
		result,
		componentFactory,
		props,
		children,
		route,
	);

	if (templateResult instanceof Response) return templateResult;

	// Mixed buffer: each entry is either a Uint8Array (static part, zero-copy)
	// or a string (expression output, to be encoded once at the end).
	// Adjacent strings are concatenated inline (V8 rope string optimization)
	// so the buffer stays compact.
	const buffer: Array<Uint8Array | string> = [];
	let renderedFirstPageChunk = false;
	// Track whether the last buffer entry is a string so we can append to it.
	let lastIsString = false;

	if (isPage) {
		await bufferHeadContent(result);
	}

	const destination: RenderDestination = {
		write(chunk) {
			if (isPage && !renderedFirstPageChunk) {
				renderedFirstPageChunk = true;
				if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
					const doctype = result.compressHTML ? '<!DOCTYPE html>' : '<!DOCTYPE html>\n';
					buffer.push(doctype);
					lastIsString = true;
				}
			}

			if (chunk instanceof Response) return;

			if (ArrayBuffer.isView(chunk)) {
				const bytes = chunk as Uint8Array;
				if (bytes.length === 0) return;
				// Small pre-encoded chunks with a cached ._str: coalesce into the
				// current string run via V8 rope concat — dramatically faster than
				// storing thousands of tiny Uint8Arrays and merging them at the end.
				// Large chunks (e.g. static-heavy's 50KB blob) stay as Uint8Array
				// to avoid an unnecessary string round-trip.
				const cached = (bytes as any)._str;
				if (cached !== undefined && bytes.byteLength <= 256) {
					if (lastIsString) {
						buffer[buffer.length - 1] = (buffer[buffer.length - 1] as string) + cached;
					} else {
						buffer.push(cached);
						lastIsString = true;
					}
				} else {
					buffer.push(bytes);
					lastIsString = false;
				}
			} else {
				// .toString() flattens HTMLString objects (from render instructions)
				// to primitive strings for correct typeof checks in the merge pass.
				const s = stringifyChunk(result, chunk).toString();
				if (s.length > 0) {
					if (lastIsString) {
						buffer[buffer.length - 1] = (buffer[buffer.length - 1] as string) + s;
					} else {
						buffer.push(s);
						lastIsString = true;
					}
				}
			}
		},
	};

	await templateResult.render(destination);

	// Fast path: empty output
	if (buffer.length === 0) {
		return new Uint8Array(0);
	}

	// Fast path: single Uint8Array — return it directly, no copy.
	if (buffer.length === 1 && typeof buffer[0] !== 'string') {
		return buffer[0] as Uint8Array;
	}

	// Merge pass: encode strings, then concatenate all Uint8Array segments.
	for (let i = 0; i < buffer.length; i++) {
		if (typeof buffer[i] === 'string') {
			buffer[i] = encoder.encode(buffer[i] as string);
		}
	}

	// Fast path: single chunk after encoding
	if (buffer.length === 1) {
		return buffer[0] as Uint8Array;
	}

	let totalBytes = 0;
	for (let i = 0; i < buffer.length; i++) {
		totalBytes += (buffer[i] as Uint8Array).length;
	}
	const out = new Uint8Array(totalBytes);
	let offset = 0;
	for (let i = 0; i < buffer.length; i++) {
		const segment = buffer[i] as Uint8Array;
		out.set(segment, offset);
		offset += segment.length;
	}
	return out;
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

	let renderedFirstPageChunk = false;

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
					await templateResult.render(destination);
					controller.close();
				} catch (e) {
					// We don't have a lot of information downstream, and upstream we can't catch the error properly
					// So let's add the location here
					if (AstroError.is(e) && !e.loc) {
						e.setLocation({
							file: route?.component,
						});
					}

					// Queue error on next microtask to flush the remaining chunks written synchronously
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
	const iterator = result._metadata.propagators.values();
	while (true) {
		const { value, done } = iterator.next();
		if (done) {
			break;
		}
		// Call component instances that might have head content to be propagated up.
		const returnValue = await value.init(result);
		if (isHeadAndContent(returnValue) && returnValue.head) {
			result._metadata.extraHead.push(returnValue.head);
		}
	}
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

	let renderedFirstPageChunk = false;
	if (isPage) {
		await bufferHeadContent(result);
	}

	// This implements the iterator protocol:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols
	// The `iterator` is passed to the Response as a stream-like thing.
	// The `buffer` array acts like a buffer. During render the `destination` pushes
	// chunks of Uint8Arrays into the buffer. The response calls `next()` and we combine
	// all of the chunks into one Uint8Array and then empty it.

	let error: Error | null = null;
	// The `next` is an object `{ promise, resolve, reject }` that we use to wait
	// for chunks to be pushed into the yield queue.
	let next: ReturnType<typeof promiseWithResolvers<void>> | null = null;
	let renderingComplete = false;

	const buffer: Array<Uint8Array | string> = [];
	// Track whether the buffer contains any Uint8Array entries so the merge
	// loop can skip the allStrings pre-scan.  Reset when buffer is drained.
	let hasBytes = false;
	// Track whether the last buffer entry is a string for inline coalescing.
	let lastIsStringStream = false;

	const iterator: AsyncIterator<Uint8Array> = {
		async next() {
			if (result.cancelled) return { done: true, value: undefined };

			if (next !== null) {
				await next.promise;
			}
			// Buffer is empty so there's nothing to receive, wait for the next resolve.
			else if (!renderingComplete && !buffer.length) {
				next = promiseWithResolvers();
				await next.promise;
			}

			// Only create a new promise if rendering is still ongoing. Otherwise
			// there will be a dangling promises that breaks tests (probably not an actual app)
			if (!renderingComplete) {
				next = promiseWithResolvers();
			}

			// If an error occurs during rendering, throw the error as we cannot proceed.
			if (error) {
				throw error;
			}

			// Fast path: if every buffered chunk is a string (common for both Go
			// compiler output and Rust compiler output whose small static parts are
			// converted to _str by chunkToByteArrayOrString), concatenate via V8 rope
			// strings and encode once.  This avoids thousands of tiny Uint8Array.set()
			// calls for expression-heavy pages.
			// The `hasBytes` flag is maintained by the write handler, avoiding
			// a full buffer scan here.
			const bufLen = buffer.length;

			let mergedArray: Uint8Array;
			if (!hasBytes && bufLen > 0) {
				// All-strings fast path: one rope concat + one encode
				let s = '';
				for (let i = 0; i < bufLen; i++) s += buffer[i] as string;
				mergedArray = encoder.encode(s);
			} else if (bufLen > 0) {
				// Mixed path: encode adjacent strings in one batch, then copy all
				// Uint8Array segments (including the encoded string runs) into the
				// output buffer.  Use Buffer.concat on Node for zero-initialization
				// savings when merging many small typed arrays.
				let length = 0;
				let stringToEncode = '';
				for (let i = 0; i < bufLen; i++) {
					const bufferEntry = buffer[i];
					if (typeof bufferEntry === 'string') {
						const nextIsString = i + 1 < bufLen && typeof buffer[i + 1] === 'string';
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
						length += (bufferEntry as Uint8Array).length;
					}
				}

				mergedArray = new Uint8Array(length);
				let offset = 0;
				for (let i = 0; i < bufLen; i++) {
					const item = buffer[i];
					if (item === '') continue;
					mergedArray.set(item as Uint8Array, offset);
					offset += (item as Uint8Array).length;
				}
			} else {
				mergedArray = new Uint8Array(0);
			}

			buffer.length = 0;
			hasBytes = false;
			lastIsStringStream = false;

			return {
				done: mergedArray.length === 0 && renderingComplete,
				value: mergedArray,
			};
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
					hasBytes = true;
					lastIsStringStream = false;
				}
			}
			if (chunk instanceof Response) {
				throw new AstroError(AstroErrorData.ResponseSentError);
			}
			const bytes = chunkToByteArrayOrString(result, chunk);
			if (bytes.length > 0) {
				if (typeof bytes === 'string') {
					// Inline string coalescing: append to the previous string entry
					// instead of pushing a new buffer entry.  This reduces buffer
					// entry count and makes the all-strings fast path more likely.
					if (lastIsStringStream) {
						buffer[buffer.length - 1] = (buffer[buffer.length - 1] as string) + bytes;
					} else {
						buffer.push(bytes);
						lastIsStringStream = true;
					}
				} else {
					buffer.push(bytes);
					hasBytes = true;
					lastIsStringStream = false;
				}
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

	// This is the Iterator protocol, an object with a `Symbol.asyncIterator`
	// function that returns an object like `{ next(): Promise<{ done: boolean; value: any }> }`
	return {
		[Symbol.asyncIterator]() {
			return iterator;
		},
	};
}

function toPromise<T>(fn: () => T | Promise<T>): Promise<T> {
	try {
		const result = fn();
		return isPromise(result) ? result : Promise.resolve(result);
	} catch (err) {
		return Promise.reject(err);
	}
}
