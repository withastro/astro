import './shim';
import type { ComponentInstance, RouteData, SSRManifest } from 'astro';
import { App } from 'astro/app';

type UserDefinedEnv = {
	[key: string]: string;
};

type Env = {
	ASSETS: { fetch: (req: Request) => Response };
} & UserDefinedEnv;

export type WithHeaders = (headers: Headers) => void;

export interface CloudflareComponent extends ComponentInstance {
	withHeaders?: WithHeaders;
}

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);

	async function fetch(request: Request, env: Env) {
		const url = new URL(request.url);

		// If static asset match, let Cloudflare handle it.
		if (manifest.assets.has(url.pathname)) {
			return env.ASSETS.fetch(request);
		}

		let routeData: RouteData | undefined;

		const request404 = new Request(new URL('/404', request.url)); // Custom 404 page
		const matchedRequest = [request, request404].find((it) => (routeData = app.match(it)));

		let module: CloudflareComponent | undefined;

		if (routeData) {
			module = manifest.pageMap.get(routeData.component);
		}

		if (matchedRequest) {
			let response = await app.render(matchedRequest, routeData);

			const { pathname } = new URL(matchedRequest.url);

			if (pathname.startsWith('/404')) {
				response = new Response(response.body, {
					status: 404,
				});
			}

			if (module && module.withHeaders) {
				module.withHeaders(response.headers);
			}

			return response;
		}

		return new Response(null, {
			status: 404,
			statusText: 'Not Found',
		});
	}

	return { default: { fetch } };
}
