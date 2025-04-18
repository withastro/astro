import { readFileSync } from 'node:fs';
import type { ErrorHandler, UrlProxyContentResolver } from '../definitions.js';

export class LocalUrlProxyContentResolver implements UrlProxyContentResolver {
	constructor(private errorHandler: ErrorHandler) {}

	resolve(url: string): string {
		try {
			return url + readFileSync(url, 'utf-8');
		} catch (cause) {
			throw this.errorHandler.handle({
				type: 'unknown-fs-error',
				data: {},
				cause,
			});
		}
	}
}

export class RemoteUrlProxyContentResolver implements UrlProxyContentResolver {
	resolve(url: string): string {
		return url;
	}
}
