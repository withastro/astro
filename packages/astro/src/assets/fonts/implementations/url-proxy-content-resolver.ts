import { readFileSync } from 'node:fs';
import type { ErrorHandler, UrlProxyContentResolver } from '../definitions.js';

export function createLocalUrlProxyContentResolver({
	errorHandler,
}: { errorHandler: ErrorHandler }): UrlProxyContentResolver {
	return {
		resolve(url) {
			try {
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
		resolve: (url) => url,
	};
}
