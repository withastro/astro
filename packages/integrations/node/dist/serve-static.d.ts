import type { IncomingMessage, ServerResponse } from 'node:http';
import type { BaseApp } from 'astro/app';
import type { NodeAppHeadersJson, Options } from './types.js';
/**
 * Resolves a URL path to a filesystem path within the client directory,
 * and checks whether it is a directory.
 *
 * Returns `isDirectory: false` if the resolved path escapes the client root
 * (e.g. via `..` path traversal segments).
 */
export declare function resolveStaticPath(
	client: string,
	urlPath: string,
): {
	filePath: string;
	isDirectory: boolean;
};
/**
 * Creates a Node.js http listener for static files and prerendered pages.
 * In standalone mode, the static handler is queried first for the static files.
 * If one matching the request path is not found, it relegates to the SSR handler.
 * Intended to be used only in the standalone mode.
 */
export declare function createStaticHandler(
	app: BaseApp,
	options: Options,
	headersMap: NodeAppHeadersJson | undefined,
): (
	req: IncomingMessage,
	res: ServerResponse,
	ssr: () => unknown,
) => ServerResponse<IncomingMessage> | undefined;
