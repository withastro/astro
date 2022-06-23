
const isNodeJS = typeof process === 'object' && Object.prototype.toString.call(process);

let RuntimeResponse: typeof Response | undefined;

function createResponseClass() {
	RuntimeResponse = class extends Response {
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
					let body = this.#body as ReadableStream<string>;
					let reader = body.getReader();
					let text = '';
					while(true) {
						let r = await reader.read();
						if(r.value) {
							text += r.value.toString();
						}
						if(r.done) {
							break;
						}
					}
					return text;
				}
				return super.text();
		}
	
		async arrayBuffer(): Promise<ArrayBuffer> {
				if(this.#isStream && isNodeJS) {
					let body = this.#body as ReadableStream<string>;
					let reader = body.getReader();
					let encoder = new TextEncoder();
					let chunks: number[] = [];
					while(true) {
						let r = await reader.read();
						if(r.value) {
							chunks.push(...encoder.encode(r.value));
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
	
	return RuntimeResponse;
}

export function createResponse(body?: BodyInit | null, init?: ResponseInit) {
	if(typeof RuntimeResponse === 'undefined') {
		return new (createResponseClass())(body, init);
	}
	return new RuntimeResponse(body, init);
}
