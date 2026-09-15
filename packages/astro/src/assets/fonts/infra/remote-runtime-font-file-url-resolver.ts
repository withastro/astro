import type { AddressInfo } from 'node:net';
import type { RuntimeFontFileUrlResolver } from '../definitions.js';

/**
 * In development, font files are served through a Vite middleware.
 * During prerendering, a temporary Node HTTP server is started to
 * serve font files.
 *
 * When possible, the resolver uses a statically known server
 * {@link address}. When the address is not yet available (e.g. the
 * virtual module was evaluated before the HTTP server started
 * listening — see #17722), the resolver falls back to deriving the
 * origin from the caller-supplied {@link requestUrl}.
 */
export class RemoteRuntimeFontFileUrlResolver implements RuntimeFontFileUrlResolver {
	#urls: Set<string>;
	#address: AddressInfo | null;

	constructor({
		urls,
		address,
	}: {
		urls: Set<string>;
		address: AddressInfo | null;
	}) {
		this.#urls = urls;
		this.#address = address;
	}

	resolve(url: string, requestUrl: URL | undefined): string | null {
		if (!this.#urls.has(url)) {
			return null;
		}
		// assetsPrefix
		if (!url.startsWith('/')) {
			if (this.#address) {
				url = new URL(url).pathname;
			} else {
				return url;
			}
		}
		if (this.#address) {
			const host =
				this.#address.family === 'IPv6' ? `[${this.#address.address}]` : this.#address.address;
			return `http://${host}:${this.#address.port}${url}`;
		}
		// Fallback when the server address was not available at module
		// load time (e.g. an adapter's dep optimizer pre-bundled the
		// font runtime before the HTTP server started listening, #17722).
		if (requestUrl) {
			return `${requestUrl.origin}${url}`;
		}
		throw new Error('Server address unavailable, this should not happen. Open an issue.');
	}
}
