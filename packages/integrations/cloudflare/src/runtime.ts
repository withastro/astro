// TODO: remove `getRuntime()` in Astro 3.0
import type { Cache, CacheStorage, IncomingRequestCfProperties } from '@cloudflare/workers-types';

export type WorkerRuntime<T = unknown> = {
	name: 'cloudflare';
	env: T;
	waitUntil(promise: Promise<any>): void;
	passThroughOnException(): void;
	caches?: CacheStorage & { default: Cache };
	cf?: IncomingRequestCfProperties;
};

export type PagesRuntime<T = unknown, U = unknown> = {
	name: 'cloudflare';
	env: T;
	functionPath: string;
	params: Record<string, string>;
	data: U;
	waitUntil(promise: Promise<any>): void;
	next(request: Request): void;
	caches?: CacheStorage & { default: Cache };
	cf?: IncomingRequestCfProperties;
};

/**
 * @deprecated since version 6.8.0
 * The `getRuntime` utility has been deprecated and should be updated to the new [`Astro.locals`](https://docs.astro.build/en/guides/middleware/#locals) API.
 * ```diff
 * - import { getRuntime } from '@astrojs/cloudflare/runtime';
 * - getRuntime(Astro.request);
 *  
 * + const runtime = Astro.locals.runtime;
 * ```
 */
export function getRuntime<T = unknown, U = unknown>(
	request: Request
): WorkerRuntime<T> | PagesRuntime<T, U> {
	if (!!request) {
		return Reflect.get(request, Symbol.for('runtime'));
	} else {
		throw new Error(
			'To retrieve the current cloudflare runtime you need to pass in the Astro request object'
		);
	}
}
