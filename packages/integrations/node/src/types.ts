import type { AstroConfig } from 'astro';
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface UserOptions {
	/** TODO: */
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

export interface Options
	extends Required<
		Pick<
			UserOptions,
			'experimentalDisableStreaming' | 'experimentalErrorPageHost' | 'staticHeaders'
		>
	> {
	host: string | boolean;
	port: number;
	server: string;
	client: string;
	assets: string;
	trailingSlash: AstroConfig['trailingSlash'];
	staticHeaders: boolean;
}

export type RequestHandler = (
	req: IncomingMessage,
	res: ServerResponse,
	next?: (err?: unknown) => void,
	locals?: object,
) => void | Promise<void>;
