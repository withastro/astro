import type { UrlProxyContentResolver } from '../definitions.js';

export class RemoteUrlProxyContentResolver implements UrlProxyContentResolver {
	// Passthrough, the remote provider URL is enough
	resolve(url: string): string {
		return url;
	}
}
