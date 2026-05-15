import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RemotePattern } from '../../types/public/config.js';
import type { RenderOptions } from './base.js';
import { App } from './app.js';
import type { NodeAppHeadersJson, SSRManifest } from './types.js';
/**
 * Allow the request body to be explicitly overridden. For example, this
 * is used by the Express JSON middleware.
 */
interface NodeRequest extends IncomingMessage {
	body?: unknown;
}
/**
 * Converts a NodeJS IncomingMessage into a web standard Request.
 * ```js
 * import { createApp } from 'astro/app/entrypoint';
 * import { createRequest } from 'astro/app/node';
 * import { createServer } from 'node:http';
 *
 * const app = createApp();
 *
 * const server = createServer(async (req, res) => {
 *     const request = createRequest(req);
 *     const response = await app.render(request);
 * })
 * ```
 */
export declare function createRequest(
	req: NodeRequest,
	{
		skipBody,
		allowedDomains,
		bodySizeLimit,
		port: serverPort,
	}?: {
		skipBody?: boolean;
		allowedDomains?: Partial<RemotePattern>[];
		bodySizeLimit?: number;
		port?: number;
	},
): Request;
/**
 * Streams a web-standard Response into a NodeJS Server Response.
 * ```js
 * import { createApp } from 'astro/app/entrypoint';
 * import { createRequest, writeResponse } from 'astro/app/node';
 * import { createServer } from 'node:http';
 *
 * const app = createApp();
 *
 * const server = createServer(async (req, res) => {
 *     const request = createRequest(req);
 *     const response = await app.render(request);
 *     await writeResponse(response, res);
 * })
 * ```
 * @param source WhatWG Response
 * @param destination NodeJS ServerResponse
 */
export declare function writeResponse(
	source: Response,
	destination: ServerResponse,
): Promise<ServerResponse<IncomingMessage> | undefined>;
/**
 * @deprecated Use `App` or `createApp()` instead, and use in conjunction with `convertRequest()`
 * and `writeResponse()` helpers. This will be removed in a future major version.
 */
export declare class NodeApp extends App {
	headersMap: NodeAppHeadersJson | undefined;
	setHeadersMap(headers: NodeAppHeadersJson): void;
	match(
		req: NodeRequest | Request,
		allowPrerenderedRoutes?: boolean,
	): import('../../index.js').RouteData | undefined;
	render(request: NodeRequest | Request, options?: RenderOptions): Promise<Response>;
	/**
	 * Converts a NodeJS IncomingMessage into a web standard Request.
	 * ```js
	 * import { NodeApp } from 'astro/app/node';
	 * import { createServer } from 'node:http';
	 *
	 * const server = createServer(async (req, res) => {
	 *     const request = NodeApp.createRequest(req);
	 *     const response = await app.render(request);
	 *     await NodeApp.writeResponse(response, res);
	 * })
	 * ```
	 */
	static createRequest: typeof createRequest;
	/**
	 * Streams a web-standard Response into a NodeJS Server Response.
	 * ```js
	 * import { NodeApp } from 'astro/app/node';
	 * import { createServer } from 'node:http';
	 *
	 * const server = createServer(async (req, res) => {
	 *     const request = NodeApp.createRequest(req);
	 *     const response = await app.render(request);
	 *     await NodeApp.writeResponse(response, res);
	 * })
	 * ```
	 * @param source WhatWG Response
	 * @param destination NodeJS ServerResponse
	 */
	static writeResponse: typeof writeResponse;
}
/**
 * Returns the cleanup function for the AbortController and socket listeners created by `createRequest()`
 * for the NodeJS IncomingMessage. This should only be called directly if the request is not
 * being handled by Astro, i.e. if not calling `writeResponse()` after `createRequest()`.
 * ```js
 * import { createRequest, getAbortControllerCleanup } from 'astro/app/node';
 * import { createServer } from 'node:http';
 *
 * const server = createServer(async (req, res) => {
 *     const request = createRequest(req);
 *     const cleanup = getAbortControllerCleanup(req);
 *     if (cleanup) cleanup();
 *     // can now safely call another handler
 * })
 * ```
 */
export declare function getAbortControllerCleanup(req?: NodeRequest): (() => void) | undefined;
/** @deprecated This will be removed in a future major version. */
export declare function loadManifest(rootFolder: URL): Promise<SSRManifest>;
/** @deprecated This will be removed in a future major version. */
export declare function loadApp(rootFolder: URL): Promise<NodeApp>;
export {};
