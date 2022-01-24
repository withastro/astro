/// <reference types="node" />
import { Server } from 'http';
import { InlineConfig, ResolvedConfig } from '.';
import { ResolvedServerOptions } from './server';
import { CommonServerOptions } from './http';
export interface PreviewOptions extends CommonServerOptions {
}
export interface ResolvedPreviewOptions extends PreviewOptions {
}
export declare function resolvePreviewOptions(preview: PreviewOptions | undefined, server: ResolvedServerOptions): ResolvedPreviewOptions;
export interface PreviewServer {
    /**
     * The resolved vite config object
     */
    config: ResolvedConfig;
    /**
     * native Node http server instance
     */
    httpServer: Server;
    /**
     * Print server urls
     */
    printUrls: () => void;
}
/**
 * Starts the Vite server in preview mode, to simulate a production deployment
 * @param config - the resolved Vite config
 * @param serverOptions - what host and port to use
 * @experimental
 */
export declare function preview(inlineConfig: InlineConfig): Promise<PreviewServer>;
