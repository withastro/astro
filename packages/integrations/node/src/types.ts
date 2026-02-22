import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'node:http';
import type { AstroIntegrationLogger, PreviewServer, SSRManifest } from 'astro';

export interface UserOptions {
	/**
	 * The path to a custom server entry point. It can be a URL, a relative path from the project root or a package import.
	 * 
	 * By default, the adapter provides a standalone HTTP server.
	 */
	serverEntrypoint?: string | URL;

	/**
	 * Disables HTML streaming. This is useful for example if there are constraints from your host.
	 */
	experimentalDisableStreaming?: boolean;

	/**
	 * If enabled, the adapter will save [static headers in the framework API file](https://docs.netlify.com/frameworks-api/#headers).
	 *
	 * Here the list of the headers that are added:
	 * - The CSP header of the static pages is added when CSP support is enabled.
	 */
	staticHeaders?: boolean;

	/**
	 * The host that should be used if the server needs to fetch the prerendered error page.
	 * If not provided, this will default to the host of the server. This should be set if the server
	 * should fetch prerendered error pages from a different host than the public URL of the server.
	 * This is useful for example if the server is behind a reverse proxy or a load balancer, or if
	 * static files are hosted on a different domain. Do not include a path in the URL: it will be ignored.
	 */
	experimentalErrorPageHost?: string | URL;
}

export interface Options {
	host: string | boolean;
	port: number;
	server: string;
	client: string;
	assets: string;
	trailingSlash: SSRManifest['trailingSlash'];
	experimentalDisableStreaming: boolean;
	experimentalErrorPageHost: string | undefined;
	staticHeaders: boolean;
}

export type RequestHandler = (
	req: IncomingMessage,
	res: ServerResponse,
	next?: (err?: unknown) => void,
	locals?: Partial<App.Locals>,
) => void | Promise<void>;

export type NodePreviewServer = Pick<PreviewServer, 'closed' | 'stop'>;

export type CreateNodePreviewServer = (options: {
	host: string;
	port: number;
	logger: AstroIntegrationLogger;
	headers: OutgoingHttpHeaders | undefined;
}) => NodePreviewServer | Promise<NodePreviewServer>;

export type HeadersJson = {
	pathname: string;
	headers: {
		key: string;
		value: string;
	}[];
}[];
