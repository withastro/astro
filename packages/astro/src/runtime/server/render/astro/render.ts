import type { RouteData, SSRResult } from '../../../../@types/astro.js';
import { AstroError, AstroErrorData } from '../../../../core/errors/index.js';
import { chunkToByteArray, decoder, encoder, type RenderDestination } from '../common.js';
import type { AstroComponentFactory } from './factory.js';
import { isHeadAndContent } from './head-and-content.js';
import { isRenderTemplateResult } from './render-template.js';
import { promiseWithResolvers } from '../util.js';

type ChunkHandler = {
	push: (data: Uint8Array) => void;
}

function createRenderer(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any,
	isPage = false,
	route?: RouteData
) {
	let renderTemplateResult: Exclude<Awaited<ReturnType<typeof callComponentAsTemplateResultOrResponse>>, Response>;
	let renderedFirstPageChunk = false;

	return {
		async prepare() {
			const templateResult = await callComponentAsTemplateResultOrResponse(
				result,
				componentFactory,
				props,
				children,
				route
			);

			// If the Astro component returns a Response on init, return that response
			if (templateResult instanceof Response) return templateResult;
			renderTemplateResult = templateResult;

			if (isPage) {
				await bufferHeadContent(result);
			}
		},
		async start(handler: ChunkHandler) {
			const destination: RenderDestination = {
				write(chunk) {
					// Automatic doctype insertion for pages
					if (isPage && !renderedFirstPageChunk) {
						renderedFirstPageChunk = true;
						if (!result.partial && !/<!doctype html/i.test(String(chunk))) {
							const doctype = result.compressHTML ? '<!DOCTYPE html>' : '<!DOCTYPE html>\n';
							handler.push(encoder.encode(doctype))
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
					handler.push(bytes);
				},
			};

			return renderTemplateResult.render(destination);
		}
	};
}

class ChunkBuffer {
	length = 0;
	chunks: Array<Uint8Array> = [];
	push(bytes: Uint8Array) {
		this.chunks.push(bytes);
		this.length += bytes.length;
	}
	concat() {
		const chunks = this.chunks;

		// Create a new array with total length and merge all source arrays.
		const mergedArray = new Uint8Array(this.length);
		let offset = 0;
		chunks.forEach(item => {
			mergedArray.set(item, offset);
			offset += item.length;
		});

		return mergedArray;
	}
	reset() {
		this.chunks.length = 0;
		this.length = 0;
	}
}


// Calls a component and renders it into a string of HTML
export async function renderToString(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any,
	isPage = false,
	route?: RouteData
): Promise<string | Response> {
	const renderer = createRenderer(result, componentFactory, props, children, isPage, route);
	await renderer.prepare();

	const chunks = new ChunkBuffer();
	await renderer.start({
		push(data) {
			chunks.push(data);
		}
	});

	return decoder.decode(chunks.concat());
}

// Calls a component and renders it into a string of HTML
export async function renderToReadableStream(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any,
	isPage = false,
	route?: RouteData
): Promise<ReadableStream | Response>  {
	const renderer = createRenderer(result, componentFactory, props, children, isPage, route);
	await renderer.prepare();

	return new ReadableStream({
		start(controller) {
			const promise = renderer.start({
				push(data) {
					controller.enqueue(data);
				}
			});

			(async () => {
				try {
					await promise;
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
	});
}

export async function renderToAsyncIterable(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any,
	isPage = false,
	route?: RouteData
): Promise<AsyncIterable<Uint8Array>> {
	const renderer = createRenderer(result, componentFactory, props, children, isPage, route);
	await renderer.prepare();

  let next = promiseWithResolvers<void>();
  let done = false;
  const chunks = new ChunkBuffer();

  const iterator = {
    async next() {
      await next.promise;

			const merged = chunks.concat();
			chunks.reset();

      const returnValue = {
        done: done || !merged.length,
        value: merged
      };

      return returnValue;
    }
  };

	renderer.start({
		push(data) {
      chunks.push(data);
      next.resolve();
      next = promiseWithResolvers<void>();
		}
	}).then(() => {
		done = true;
	});

  return {
    [Symbol.asyncIterator]() {
      return iterator;
    }
  };
}

async function callComponentAsTemplateResultOrResponse(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any,
	route?: RouteData
) {
	const factoryResult = await componentFactory(result, props, children);

	if (factoryResult instanceof Response) {
		return factoryResult;
	} else if (!isRenderTemplateResult(factoryResult)) {
		throw new AstroError({
			...AstroErrorData.OnlyResponseCanBeReturned,
			message: AstroErrorData.OnlyResponseCanBeReturned.message(route?.route, typeof factoryResult),
			location: {
				file: route?.component,
			},
		});
	}

	return isHeadAndContent(factoryResult) ? factoryResult.content : factoryResult;
}

// Recursively calls component instances that might have head content
// to be propagated up.
async function bufferHeadContent(result: SSRResult) {
	const iterator = result._metadata.propagators.values();
	while (true) {
		const { value, done } = iterator.next();
		if (done) {
			break;
		}
		// Call component instances that might have head content to be propagated up.
		const returnValue = await value.init(result);
		if (isHeadAndContent(returnValue)) {
			result._metadata.extraHead.push(returnValue.head);
		}
	}
}
