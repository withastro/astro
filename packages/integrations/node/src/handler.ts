import type { BaseApp } from 'astro/app';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Options } from './types.js';
import { readErrorPageFromDisk, resolveClientDir } from './shared.js';

export function createHandleRequestDeps(
	app: BaseApp,
	options: Pick<Options, 'server' | 'client' | 'experimentalErrorPageHost'>,
) {
	/**
	 * Keep track of the current request path using AsyncLocalStorage.
	 * Used to log unhandled rejections with a helpful message.
	 */
	const als = new AsyncLocalStorage<string>();
	const logger = app.getAdapterLogger();
	process.on('unhandledRejection', (reason) => {
		const requestUrl = als.getStore();
		logger.error(`Unhandled rejection while rendering ${requestUrl}`);
		console.error(reason);
	});

	const client = resolveClientDir(options);

	// Read prerendered error pages directly from disk instead of fetching over HTTP.
	// This avoids SSRF risks and is more efficient.
	const prerenderedErrorPageFetch = async (url: string): Promise<Response> => {
		if (url.includes('/404')) {
			const response = await readErrorPageFromDisk(client, 404);
			if (response) return response;
		}
		if (url.includes('/500')) {
			const response = await readErrorPageFromDisk(client, 500);
			if (response) return response;
		}
		// Fallback: if experimentalErrorPageHost is configured, fetch from there
		if (options.experimentalErrorPageHost) {
			const originUrl = new URL(options.experimentalErrorPageHost);
			const errorPageUrl = new URL(url);
			errorPageUrl.protocol = originUrl.protocol;
			errorPageUrl.host = originUrl.host;
			return fetch(errorPageUrl);
		}
		// No file found and no fallback configured - return empty response
		return new Response(null, { status: 404 });
	};

	return { als, prerenderedErrorPageFetch };
}

export async function handleRequest<TNext extends ((err?: unknown) => void) | undefined>({
	app,
	request,
	locals,
	next,
	als,
	prerenderedErrorPageFetch,
}: {
	app: BaseApp;
	request: Request;
	locals: Partial<App.Locals> | undefined;
	next: TNext;
	prerenderedErrorPageFetch: ((url: string) => Promise<Response>) | undefined;
	als: AsyncLocalStorage<string>;
}): Promise<TNext extends () => any ? unknown : Response> {
	// Redirects are considered prerendered routes in static mode, but we want to
	// handle them dynamically, so prerendered routes are included here.
	const routeData = app.match(request, true);
	// But we still want to skip prerendered pages.
	if (routeData && !(routeData.type === 'page' && routeData.prerender)) {
		return await als.run(request.url, () =>
			app.render(request, {
				addCookieHeader: true,
				locals,
				routeData,
				prerenderedErrorPageFetch,
			}),
		);
	}

	if (next) {
		return next() as any;
	}

	return await app.render(request, { addCookieHeader: true, prerenderedErrorPageFetch });
}
