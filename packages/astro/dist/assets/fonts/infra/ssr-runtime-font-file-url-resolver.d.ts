import type { RuntimeFontFileUrlResolver } from '../definitions.js';
/**
 * During SSR, we don't know ahead of time where the server is located.
 * We rely on `requestUrl` (provided by the user) to construct the URL.
 */
export declare class SsrRuntimeFontFileUrlResolver implements RuntimeFontFileUrlResolver {
	#private;
	constructor({ urls }: { urls: Set<string> });
	resolve(url: string, requestUrl: URL | undefined): string | null;
}
