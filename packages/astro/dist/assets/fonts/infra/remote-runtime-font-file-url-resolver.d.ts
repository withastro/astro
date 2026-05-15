import type { AddressInfo } from 'node:net';
import type { RuntimeFontFileUrlResolver } from '../definitions.js';
/**
 * In development, font files are served through a Vite middleware.
 * During prerendering, a temporary Node HTTP server is started to
 * serve font files.
 *
 * We send request to the provided server address. `requestUrl` on
 * `fetch` is not implemented because we have the information from
 * within the Vite plugin already.
 */
export declare class RemoteRuntimeFontFileUrlResolver implements RuntimeFontFileUrlResolver {
	#private;
	constructor({ urls, address }: { urls: Set<string>; address: AddressInfo | null });
	resolve(url: string): string | null;
}
