import { env as globalEnv } from 'cloudflare:workers';
import {
	sessionKVBindingName,
	compileImageConfig,
	isPrerender,
} from 'virtual:astro-cloudflare:config';
import { createApp } from 'astro/app/entrypoint';
import { setGetEnv } from 'astro/env/setup';
import { createGetEnv } from '../utils/env.js';
import {
	isStaticPathsRequest,
	isPrerenderRequest,
	handleStaticPathsRequest,
	handlePrerenderRequest,
	isStaticImagesRequest,
	handleStaticImagesRequest,
} from './prerender.js';
import { getValidatedIpFromHeader } from '@astrojs/internal-helpers/request';
setGetEnv(createGetEnv(globalEnv));
const app = createApp();
async function handle(request, env, context) {
	if (isPrerender) {
		if (compileImageConfig) {
			const { installAddStaticImage } = await import('./static-image-collection.js');
			installAddStaticImage(compileImageConfig);
		}
		if (isStaticPathsRequest(request)) {
			return handleStaticPathsRequest(app);
		}
		if (isPrerenderRequest(request)) {
			return handlePrerenderRequest(app, request);
		}
		if (isStaticImagesRequest(request)) {
			return handleStaticImagesRequest();
		}
	}
	const { pathname: requestPathname } = new URL(request.url);
	if (env[sessionKVBindingName]) {
		const sessionConfigOptions = app.manifest.sessionConfig?.options ?? {};
		Object.assign(sessionConfigOptions, {
			binding: env[sessionKVBindingName],
		});
	}
	if (app.manifest.assets.has(requestPathname)) {
		return env.ASSETS.fetch(request.url.replace(/\.html$/, ''));
	}
	let routeData = void 0;
	if (app.isDev()) {
		const result = await app.devMatch(app.getPathnameFromRequest(request));
		if (result) {
			routeData = result.routeData;
		}
	} else {
		routeData = app.match(request);
	}
	if (!routeData) {
		const asset = await env.ASSETS.fetch(
			request.url.replace(/index.html$/, '').replace(/\.html$/, ''),
		);
		if (asset.status !== 404) {
			return asset;
		}
	}
	const locals = {
		cfContext: context,
	};
	Object.defineProperty(locals, 'runtime', {
		enumerable: false,
		value: {
			get env() {
				throw new Error(
					`Astro.locals.runtime.env has been removed in Astro v6. Use 'import { env } from "cloudflare:workers"' instead.`,
				);
			},
			get cf() {
				throw new Error(
					`Astro.locals.runtime.cf has been removed in Astro v6. Use 'Astro.request.cf' instead.`,
				);
			},
			get caches() {
				throw new Error(
					`Astro.locals.runtime.caches has been removed in Astro v6. Use the global 'caches' object instead.`,
				);
			},
			get ctx() {
				throw new Error(
					`Astro.locals.runtime.ctx has been removed in Astro v6. Use 'Astro.locals.cfContext' instead.`,
				);
			},
		},
	});
	const waitUntil = context.waitUntil.bind(context);
	const response = await app.render(request, {
		routeData,
		locals,
		waitUntil,
		prerenderedErrorPageFetch: async (url) => {
			return env.ASSETS.fetch(url.replace(/\.html$/, ''));
		},
		clientAddress: getValidatedIpFromHeader(request.headers.get('cf-connecting-ip')),
	});
	if (app.setCookieHeaders) {
		for (const setCookieHeader of app.setCookieHeaders(response)) {
			response.headers.append('Set-Cookie', setCookieHeader);
		}
	}
	return response;
}
export { handle };
