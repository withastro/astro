import type {
	ComponentInstance,
	EndpointHandler,
	ManifestData,
	RouteData,
} from '../../@types/astro';
import type { SSRManifest as Manifest, RouteInfo } from './types';
import type { LogOptions } from '../logger/core.js';

import mime from 'mime';
import { consoleLogDestination } from '../logger/console.js';
export { deserializeManifest } from './common.js';
import { matchRoute } from '../routing/match.js';
import { render } from '../render/core.js';
import { call as callEndpoint } from '../endpoint/index.js';
import { RouteCache } from '../render/route-cache.js';
import {
	createLinkStylesheetElementSet,
	createModuleScriptElementWithSrcSet,
} from '../render/ssr-element.js';
import { prependForwardSlash } from '../path.js';

export const pagesVirtualModuleId = '@astrojs-pages-virtual-entry';
export const resolvedPagesVirtualModuleId = '\0' + pagesVirtualModuleId;

export class App {
	#manifest: Manifest;
	#manifestData: ManifestData;
	#routeDataToRouteInfo: Map<RouteData, RouteInfo>;
	#routeCache: RouteCache;
	#encoder = new TextEncoder();
	#logging: LogOptions = {
		dest: consoleLogDestination,
		level: 'info',
	};

	constructor(manifest: Manifest) {
		this.#manifest = manifest;
		this.#manifestData = {
			routes: manifest.routes.map((route) => route.routeData),
		};
		this.#routeDataToRouteInfo = new Map(manifest.routes.map((route) => [route.routeData, route]));
		this.#routeCache = new RouteCache(this.#logging);
	}
	match(request: Request): RouteData | undefined {
		const url = new URL(request.url);
		return matchRoute(url.pathname, this.#manifestData);
	}
	async render(request: Request, routeData?: RouteData): Promise<Response> {
		if (!routeData) {
			routeData = this.match(request);
			if (!routeData) {
				return new Response(null, {
					status: 404,
					statusText: 'Not found',
				});
			}
		}

		const mod = this.#manifest.pageMap.get(routeData.component)!;

		if (routeData.type === 'page') {
			return this.#renderPage(request, routeData, mod);
		} else if (routeData.type === 'endpoint') {
			return this.#callEndpoint(request, routeData, mod);
		} else {
			throw new Error(`Unsupported route type [${routeData.type}].`);
		}
	}

	async #renderPage(
		request: Request,
		routeData: RouteData,
		mod: ComponentInstance
	): Promise<Response> {
		const url = new URL(request.url);
		const manifest = this.#manifest;
		const renderers = manifest.renderers;
		const info = this.#routeDataToRouteInfo.get(routeData!)!;
		const links = createLinkStylesheetElementSet(info.links, manifest.site);

		const filteredScripts = info.scripts.filter(
			(script) => typeof script !== 'string' && script?.stage !== 'head-inline'
		) as string[];
		const scripts = createModuleScriptElementWithSrcSet(filteredScripts, manifest.site);

		// Add all injected scripts to the page.
		for (const script of info.scripts) {
			if (typeof script !== 'string' && script.stage === 'head-inline') {
				scripts.add({
					props: {},
					children: script.children,
				});
			}
		}

		const result = await render({
			links,
			logging: this.#logging,
			markdown: manifest.markdown,
			mod,
			origin: url.origin,
			pathname: url.pathname,
			scripts,
			renderers,
			async resolve(specifier: string) {
				if (!(specifier in manifest.entryModules)) {
					throw new Error(`Unable to resolve [${specifier}]`);
				}
				const bundlePath = manifest.entryModules[specifier];
				return bundlePath.startsWith('data:') ? bundlePath : prependForwardSlash(bundlePath);
			},
			route: routeData,
			routeCache: this.#routeCache,
			site: this.#manifest.site,
			ssr: true,
			request,
		});

		if (result.type === 'response') {
			return result.response;
		}

		let html = result.html;
		let init = result.response;
		let headers = init.headers as Headers;
		let bytes = this.#encoder.encode(html);
		headers.set('Content-Type', 'text/html');
		headers.set('Content-Length', bytes.byteLength.toString());
		return new Response(bytes, init);
	}

	async #callEndpoint(
		request: Request,
		routeData: RouteData,
		mod: ComponentInstance
	): Promise<Response> {
		const url = new URL(request.url);
		const handler = mod as unknown as EndpointHandler;
		const result = await callEndpoint(handler, {
			logging: this.#logging,
			origin: url.origin,
			pathname: url.pathname,
			request,
			route: routeData,
			routeCache: this.#routeCache,
			ssr: true,
		});

		if (result.type === 'response') {
			return result.response;
		} else {
			const body = result.body;
			const headers = new Headers();
			const mimeType = mime.getType(url.pathname);
			if (mimeType) {
				headers.set('Content-Type', mimeType);
			}
			const bytes = this.#encoder.encode(body);
			headers.set('Content-Length', bytes.byteLength.toString());
			return new Response(bytes, {
				status: 200,
				headers,
			});
		}
	}
}
