import { NodeApp } from 'astro/app/node';
import { manifest } from 'astro:ssr-manifest';
import { setGetEnv } from 'astro/env/setup';
import * as options from 'virtual:astro-node:config';
import { AsyncLocalStorage } from 'node:async_hooks';

setGetEnv((key) => process.env[key]);

// TODO: find a way to unify with createAppHandler
export async function handle(request: Request, locals?: object): Promise<Response> {
	const app = new NodeApp(manifest, !options.experimentalDisableStreaming);
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
	const originUrl = options.experimentalErrorPageHost
		? new URL(options.experimentalErrorPageHost)
		: undefined;

	const prerenderedErrorPageFetch = originUrl
		? (url: string) => {
				const errorPageUrl = new URL(url);
				errorPageUrl.protocol = originUrl.protocol;
				errorPageUrl.host = originUrl.host;
				return fetch(errorPageUrl);
			}
		: undefined;

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

	return await app.render(request, { addCookieHeader: true, prerenderedErrorPageFetch });
}
