import type { OutgoingHttpHeaders } from 'node:http';
import type { AstroIntegrationLogger } from '../../core/logger/core.js';

export interface PreviewServer {
	host?: string;
	port: number;
	closed(): Promise<void>;
	stop(): Promise<void>;
}

export interface PreviewServerParams {
	outDir: URL;
	client: URL;
	server: URL;
	serverEntrypoint: URL;
	host: string | undefined;
	port: number;
	base: string;
	logger: AstroIntegrationLogger;
	headers?: OutgoingHttpHeaders;
	/**
	 * Configures allowed hosts that the preview server can respond to.
	 * If the `Host` header doesn't match one of the allowed hosts, the server will return a 403 response.
	 */
	allowedHosts?: string[] | true;
	/**
	 * Controls whether the preview server should open in the browser on startup.
	 * Pass a full URL string (e.g. "http://example.com") or a pathname (e.g. "/about") to specify the URL to open.
	 */
	open?: string | boolean;
	root: URL;
}

export type CreatePreviewServer = (
	params: PreviewServerParams,
) => PreviewServer | Promise<PreviewServer>;

export interface PreviewModule {
	default: CreatePreviewServer;
}
