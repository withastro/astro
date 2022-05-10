import { _renderStream } from './index.js';
import { Readable } from 'node:stream';
import { HTMLString } from './escape.js';

export const StreamingIterator = Symbol.for('astro:streaming-iterator');

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

interface RenderToReadableStreamOptions {
  identifierPrefix?: string,
  namespaceURI?: string,
  progressiveChunkSize?: number,
  signal?: AbortSignal,
  onReadyToStream?: () => void,
  onCompleteAll?: () => void,
  onError?: (error: any) => void,
};

export function renderToReadableStream(
  Component: any,
  options?: RenderToReadableStreamOptions,
): ReadableStream {
	let aborted = false;
  if (options && options.signal) {
    const signal = options.signal;
    const listener = () => {
      aborted = true;
      signal.removeEventListener('abort', listener);
    };
    signal.addEventListener('abort', listener);
  }

	const encoder = new TextEncoder();
	async function push(controller: ReadableStreamController<Uint8Array>) {
		for await (const value of Component) {
			if (aborted) break;
			if (typeof value === 'object' && value.done) {
				controller.close();
				break;
			}
			if (value || value === 0) {
				controller.enqueue(encoder.encode(value.toString()));
			}
		}
	}

  const stream = new ReadableStream({
    async pull(controller) {
			await push(controller);
			controller.close();
    },
    cancel(reason) {
			aborted = true;
		},
  });

  return stream;
}

export function renderToNodeStream(
  Component: any,
  options?: RenderToReadableStreamOptions,
): Readable {
	let aborted = false;
  if (options && options.signal) {
    const signal = options.signal;
    const listener = () => {
      aborted = true;
      signal.removeEventListener('abort', listener);
    };
    signal.addEventListener('abort', listener);
  }

	const encoder = new TextEncoder();
	async function* body() {
		for await (const value of Component) {
			if (aborted) return;
			if (value || value === 0) {
				// for await (const subvalue of _render(value)) {
				// 	console.log(subvalue);
				// 	yield encoder.encode(subvalue.toString());
				// }
				
			}
		}
	}

  const stream = Readable.from(body());

  return stream;
}
