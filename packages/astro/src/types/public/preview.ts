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
	serverEntrypoint: URL;
	host: string | undefined;
	port: number;
	base: string;
	logger: AstroIntegrationLogger;
	headers?: OutgoingHttpHeaders;
	/**
	 * DO NOT USE. This is for internal use only and might be removed soon.
	 * @deprecated
	 */
	createCodegenDir: () => URL;
	root: URL;
}

export type CreatePreviewServer = (
	params: PreviewServerParams,
) => PreviewServer | Promise<PreviewServer>;

export interface PreviewModule {
	default: CreatePreviewServer;
}
