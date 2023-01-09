const isNodeJS =
	typeof process === 'object' && Object.prototype.toString.call(process) === '[object process]';

let StreamingCompatibleResponse: typeof Response | undefined;

// Undici on Node 16 does not support simply iterating over a ReadableStream
async function* streamAsyncIterator(stream: ReadableStream) {
	const reader = stream.getReader();

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) return;
			yield value;
		}
	} finally {
		reader.releaseLock();
	}
}

function createResponseClass() {
	StreamingCompatibleResponse = class extends Response {
		#isStream: boolean;
		#body: any;
		constructor(body?: BodyInit | null, init?: ResponseInit) {
			let isStream = body instanceof ReadableStream;
			super(isStream ? null : body, init);
			this.#isStream = isStream;
			this.#body = body;
		}

		get body() {
			return this.#body;
		}

		async text(): Promise<string> {
			if (this.#isStream && isNodeJS) {
				let decoder = new TextDecoder();
				let body = this.#body;
				let out = '';
				for await (let chunk of streamAsyncIterator(body)) {
					out += decoder.decode(chunk);
				}
				return out;
			}
			return super.text();
		}

		async arrayBuffer(): Promise<ArrayBuffer> {
			if (this.#isStream && isNodeJS) {
				let body = this.#body;
				let chunks: Uint8Array[] = [];
				let len = 0;
				for await (let chunk of streamAsyncIterator(body)) {
					chunks.push(chunk);
					len += chunk.length;
				}
				let ab = new Uint8Array(len);
				let offset = 0;
				for (const chunk of chunks) {
					ab.set(chunk, offset);
					offset += chunk.length;
				}
				return ab;
			}
			return super.arrayBuffer();
		}
	};

	return StreamingCompatibleResponse;
}

type CreateResponseFn = (body?: BodyInit | null, init?: ResponseInit) => Response;

export const createResponse: CreateResponseFn = isNodeJS
	? (body, init) => {
			if (typeof body === 'string' || ArrayBuffer.isView(body)) {
				return new Response(body, init);
			}
			if (typeof StreamingCompatibleResponse === 'undefined') {
				return new (createResponseClass())(body, init);
			}
			return new StreamingCompatibleResponse(body, init);
	  }
	: (body, init) => new Response(body, init);
