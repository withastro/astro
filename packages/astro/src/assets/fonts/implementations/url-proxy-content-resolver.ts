import { readFileSync } from 'node:fs';
import type { ErrorHandler, UrlProxyContentResolver } from '../definitions.js';

export function createLocalUrlProxyContentResolver({
	errorHandler,
}: {
	errorHandler: ErrorHandler;
}): UrlProxyContentResolver {
	return {
		resolve(url) {
			try {
				// We use the url and the file content for the hash generation because:
				// - The URL is not hashed unlike remote providers
				// - A font file can renamed and swapped so we would incorrectly cache it
				return url + readFileSync(url, 'utf-8');
			} catch (cause) {
				throw errorHandler.handle({
					type: 'unknown-fs-error',
					data: {},
					cause,
				});
			}
		},
	};
}

export function createRemoteUrlProxyContentResolver(): UrlProxyContentResolver {
	return {
		// Passthrough, the remote provider URL is enough
		resolve: (url) => url,
	};
}
