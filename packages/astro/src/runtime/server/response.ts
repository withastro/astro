
const isNodeJS = typeof process === 'object' && Object.prototype.toString.call(process) === '[object process]';

let StreamingCompatibleResponse: typeof Response | undefined;

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
				if(this.#isStream && isNodeJS) {
					let decoder = new TextDecoder();
					let body = this.#body as ReadableStream<Uint8Array>;
					let reader = body.getReader();
					let buffer: number[] = [];
					while(true) {
						let r = await reader.read();
						if(r.value) {
							buffer.push(...r.value);
						}
						if(r.done) {
							break;
						}
					}
					return decoder.decode(Uint8Array.from(buffer));
				}
				return super.text();
		}
	
		async arrayBuffer(): Promise<ArrayBuffer> {
				if(this.#isStream && isNodeJS) {
					let body = this.#body as ReadableStream<Uint8Array>;
					let reader = body.getReader();
					let chunks: number[] = [];
					while(true) {
						let r = await reader.read();
						if(r.value) {
							chunks.push(...r.value);
						}
						if(r.done) {
							break;
						}
					}
					return Uint8Array.from(chunks);
				}
				return super.arrayBuffer();
		}
	}
	
	return StreamingCompatibleResponse;
}

type CreateResponseFn = (body?: BodyInit | null, init?: ResponseInit) => Response;

export const createResponse: CreateResponseFn = isNodeJS ? (body, init) => {
	if(typeof StreamingCompatibleResponse === 'undefined') {
		return new (createResponseClass())(body, init);
	}
	return new StreamingCompatibleResponse(body, init);
} : (body, init) => new Response(body, init);
