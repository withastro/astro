import type { CreatePreviewServer } from 'astro';
import { type ResolvedServerUrls } from 'vite';
declare const createPreviewServer: CreatePreviewServer;
/** Display server host and startup time */
export declare function serverStart({
	startupTime,
	resolvedUrls,
	host,
	base,
}: {
	startupTime: number;
	resolvedUrls: ResolvedServerUrls;
	host: string | undefined;
	base: string;
}): string;
export { createPreviewServer as default };
