import { type IncomingMessage, STATUS_CODES } from 'node:http';
import type { Duplex } from 'node:stream';
import type { BaseApp } from 'astro/app';
import { createRequestFromNodeRequest } from 'astro/app/node';
import { type WebSocket as NodeWebSocket, WebSocketServer } from 'ws';
import type { Options } from './types.js';

export type UpgradeHandler = (
	req: IncomingMessage,
	socket: Duplex,
	head: Buffer,
	next?: () => void,
	locals?: object,
) => Promise<void>;

// Headers that describe the HTTP/1.1 framing of the original response, which
// the raw writer and the WebSocket handshake each set themselves.
const FRAMING_HEADERS = new Set([
	'connection',
	'content-length',
	'keep-alive',
	'sec-websocket-accept',
	'sec-websocket-extensions',
	'sec-websocket-protocol',
	'transfer-encoding',
	'upgrade',
]);

/**
 * Creates a listener for the Node.js server's `upgrade` event. The upgrade
 * request runs through `app.render()` like any other request, with an
 * `upgradeWebSocket` hook so routes can accept it through
 * `context.websocket`.
 *
 * When the route returns the response from `context.websocket.upgrade()`, the
 * WebSocket handshake completes with that response's headers, so cookies set
 * during the request reach the client. Any other response is written to the
 * socket as a plain HTTP response and the connection is closed.
 *
 * If `next` is provided, it is called for requests that match no route, so
 * other upgrade handlers on the same server can take them.
 */
export function createUpgradeHandler(app: BaseApp, options: Options): UpgradeHandler {
	const logger = app.adapterLogger;
	const wss = new WebSocketServer({ noServer: true });
	const handshakeHeaders = new WeakMap<IncomingMessage, string[]>();
	wss.on('headers', (headers, req) => {
		const extra = handshakeHeaders.get(req);
		if (extra) headers.push(...extra);
	});

	return async (req, socket, head, next, locals) => {
		// Without a listener, a client reset before the handshake would be an
		// uncaught `error` event. `ws` installs its own once the handshake starts.
		const destroyOnError = () => socket.destroy();
		socket.on('error', destroyOnError);

		let request: Request;
		try {
			request = createRequestFromNodeRequest(req, {
				allowedDomains: app.getAllowedDomains?.() ?? [],
				port: options.port,
				skipBody: true,
			});
		} catch {
			await writeRawResponse(socket, new Response('Bad Request', { status: 400 }));
			return;
		}

		const routeData = app.match(request);
		if (!routeData) {
			socket.off('error', destroyOnError);
			if (next) return next();
			await writeRawResponse(socket, new Response('Not Found', { status: 404 }));
			return;
		}

		let accepted: { socket: ServerWebSocket; response: Response } | undefined;
		let response: Response;
		try {
			response = await app.render(request, {
				addCookieHeader: true,
				locals,
				routeData,
				upgradeWebSocket(upgradeRequest) {
					accepted = {
						socket: new ServerWebSocket(upgradeRequest.url),
						response: new Response(null, { status: 200 }),
					};
					return { socket: accepted.socket as unknown as WebSocket, response: accepted.response };
				},
			});
		} catch (err) {
			const error = err instanceof Error ? err.stack || err.message : String(err);
			logger.error(`Could not render ${request.url}\n${error}`);
			accepted?.socket[FAIL]();
			await writeRawResponse(socket, new Response('Internal Server Error', { status: 500 }));
			return;
		}

		if (!accepted || response !== accepted.response) {
			accepted?.socket[FAIL]();
			await writeRawResponse(socket, response);
			return;
		}

		const serverSocket = accepted.socket;
		socket.off('error', destroyOnError);
		// `ws` answers an invalid handshake itself and never calls back, so the
		// connection closing first means the socket will never open.
		const onCloseBeforeOpen = () => serverSocket[FAIL]();
		socket.once('close', onCloseBeforeOpen);
		handshakeHeaders.set(req, toHeaderLines(response.headers));
		wss.handleUpgrade(req, socket, head, (ws) => {
			socket.off('close', onCloseBeforeOpen);
			serverSocket[ATTACH](ws);
		});
	};
}

function toHeaderLines(headers: Headers): string[] {
	const lines: string[] = [];
	for (const [name, value] of headers) {
		if (name === 'set-cookie' || FRAMING_HEADERS.has(name)) continue;
		lines.push(`${name}: ${value}`);
	}
	for (const cookie of headers.getSetCookie()) {
		lines.push(`set-cookie: ${cookie}`);
	}
	return lines;
}

async function writeRawResponse(socket: Duplex, response: Response): Promise<void> {
	const body = Buffer.from(await response.arrayBuffer());
	if (!socket.writable) {
		socket.destroy();
		return;
	}
	const head = [
		`HTTP/1.1 ${response.status} ${STATUS_CODES[response.status] ?? ''}`,
		...toHeaderLines(response.headers),
		'connection: close',
		`content-length: ${body.byteLength}`,
	];
	socket.end(Buffer.concat([Buffer.from(`${head.join('\r\n')}\r\n\r\n`), body]));
}

const ATTACH = Symbol('attach');
const FAIL = Symbol('fail');

// `CloseEvent` is global from Node.js 23; the adapter supports Node.js 22.
const CloseEventImpl: typeof CloseEvent =
	globalThis.CloseEvent ??
	class CloseEvent extends Event {
		readonly code: number;
		readonly reason: string;
		readonly wasClean: boolean;
		constructor(type: string, init: CloseEventInit = {}) {
			super(type, init);
			this.code = init.code ?? 0;
			this.reason = init.reason ?? '';
			this.wasClean = init.wasClean ?? false;
		}
	};

type EventHandler = ((event: any) => void) | null;

/**
 * The server side of a WebSocket connection, implementing the standard
 * `WebSocket` interface. It is created in the `CONNECTING` state while the
 * route runs, and attaches to the `ws` connection once the handshake
 * completes.
 */
class ServerWebSocket extends EventTarget {
	static readonly CONNECTING = 0;
	static readonly OPEN = 1;
	static readonly CLOSING = 2;
	static readonly CLOSED = 3;
	readonly CONNECTING = 0;
	readonly OPEN = 1;
	readonly CLOSING = 2;
	readonly CLOSED = 3;

	readonly url: string;
	binaryType: 'blob' | 'arraybuffer' = 'blob';
	#ws: NodeWebSocket | undefined;
	#readyState = 0;
	#pendingClose: { code?: number; reason?: string } | undefined;
	#handlers: Record<string, EventHandler> = {};

	constructor(url: string) {
		super();
		this.url = url.replace(/^http/, 'ws');
	}

	get readyState(): number {
		return this.#ws ? this.#ws.readyState : this.#readyState;
	}
	get bufferedAmount(): number {
		return this.#ws?.bufferedAmount ?? 0;
	}
	get protocol(): string {
		return this.#ws?.protocol ?? '';
	}
	get extensions(): string {
		return this.#ws?.extensions ?? '';
	}

	get onopen() {
		return this.#handlers.open ?? null;
	}
	set onopen(handler: EventHandler) {
		this.#setHandler('open', handler);
	}
	get onmessage() {
		return this.#handlers.message ?? null;
	}
	set onmessage(handler: EventHandler) {
		this.#setHandler('message', handler);
	}
	get onclose() {
		return this.#handlers.close ?? null;
	}
	set onclose(handler: EventHandler) {
		this.#setHandler('close', handler);
	}
	get onerror() {
		return this.#handlers.error ?? null;
	}
	set onerror(handler: EventHandler) {
		this.#setHandler('error', handler);
	}

	send(data: string | ArrayBufferLike | ArrayBufferView | Blob): void {
		if (!this.#ws) {
			throw new DOMException(
				'WebSocket is not open: readyState 0 (CONNECTING)',
				'InvalidStateError',
			);
		}
		// Data sent after `close()` is discarded, as in the WebSocket standard.
		if (this.#ws.readyState !== this.OPEN) return;
		this.#ws.send(data);
	}

	close(code?: number, reason?: string): void {
		if (this.#ws) {
			this.#ws.close(code, reason);
			return;
		}
		if (this.#readyState === this.CONNECTING) {
			this.#readyState = this.CLOSING;
			this.#pendingClose = { code, reason };
		}
	}

	[ATTACH](ws: NodeWebSocket): void {
		this.#ws = ws;
		ws.binaryType = 'nodebuffer';
		ws.on('message', (data: Buffer, isBinary: boolean) => {
			let payload: string | ArrayBuffer | Blob;
			if (!isBinary) payload = data.toString('utf8');
			else if (this.binaryType === 'arraybuffer') payload = new Uint8Array(data).buffer;
			else payload = new Blob([new Uint8Array(data)]);
			this.dispatchEvent(new MessageEvent('message', { data: payload }));
		});
		ws.on('error', (error) => this.dispatchEvent(new ErrorEvent('error', { error })));
		ws.on('close', (code: number, reason: Buffer) =>
			this.dispatchEvent(
				new CloseEventImpl('close', { code, reason: reason.toString(), wasClean: code !== 1006 }),
			),
		);
		this.dispatchEvent(new Event('open'));
		if (this.#pendingClose) ws.close(this.#pendingClose.code, this.#pendingClose.reason);
	}

	/** Closes a socket that never opened, as a browser does when the handshake fails. */
	[FAIL](): void {
		if (this.#ws || this.#readyState === this.CLOSED) return;
		this.#readyState = this.CLOSED;
		this.dispatchEvent(new Event('error'));
		this.dispatchEvent(new CloseEventImpl('close', { code: 1006, wasClean: false }));
	}

	#setHandler(type: string, handler: EventHandler): void {
		const current = this.#handlers[type];
		if (current) this.removeEventListener(type, current);
		this.#handlers[type] = handler;
		if (handler) this.addEventListener(type, handler);
	}
}
