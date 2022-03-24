import type { ComponentInstance, EndpointHandler, ManifestData, RouteData } from '../../@types/astro';
import type { SSRManifest as Manifest, RouteInfo } from './types';

import mime from 'mime';
import { defaultLogOptions } from '../logger.js';
export { deserializeManifest } from './common.js';
import { matchRoute } from '../routing/match.js';
import { render } from '../render/core.js';
import { call as callEndpoint } from '../endpoint/index.js';
import { RouteCache } from '../render/route-cache.js';
import { createLinkStylesheetElementSet, createModuleScriptElementWithSrcSet } from '../render/ssr-element.js';
import { prependForwardSlash } from '../path.js';

export class App {
	#manifest: Manifest;
	#manifestData: ManifestData;
	#routeDataToRouteInfo: Map<RouteData, RouteInfo>;
	#routeCache: RouteCache;
	#encoder = new TextEncoder();

	constructor(manifest: Manifest) {
		this.#manifest = manifest;
		this.#manifestData = {
			routes: manifest.routes.map((route) => route.routeData),
		};
		this.#routeDataToRouteInfo = new Map(manifest.routes.map((route) => [route.routeData, route]));
		this.#routeCache = new RouteCache(defaultLogOptions);
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

		if(routeData.type === 'page') {
			return this.#renderPage(request, routeData, mod);
		} else if(routeData.type === 'endpoint') {
			return this.#callEndpoint(request, routeData, mod);
		} else {
			throw new Error(`Unsupported route type [${routeData.type}].`);
		}
	}

	async #renderPage(request: Request, routeData: RouteData, mod: ComponentInstance): Promise<Response> {
		const url = new URL(request.url);
		const manifest = this.#manifest;
		const renderers = manifest.renderers;
		const info = this.#routeDataToRouteInfo.get(routeData!)!;
		const links = createLinkStylesheetElementSet(info.links, manifest.site);
		const scripts = createModuleScriptElementWithSrcSet(info.scripts, manifest.site);

		const result = await render({
			legacyBuild: false,
			links,
			logging: defaultLogOptions,
			markdownRender: manifest.markdown.render,
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
			method: info.routeData.type === 'endpoint' ? '' : 'GET',
			headers: request.headers,
		});

		if (result.type === 'response') {
			return result.response;
		}

		let html = result.html;
		let bytes = this.#encoder.encode(html);
		return new Response(bytes, {
			status: 200,
			headers: {
				'Content-Type': 'text/html',
				'Content-Length': bytes.byteLength.toString()
			}
		});
	}

	async #callEndpoint(request: Request, routeData: RouteData, mod: ComponentInstance): Promise<Response> {
		const url = new URL(request.url);
		const handler = mod as unknown as EndpointHandler;
		const result = await callEndpoint(handler, {
			headers: request.headers,
			logging: defaultLogOptions,
			method: request.method,
			origin: url.origin,
			pathname: url.pathname,
			routeCache: this.#routeCache,
			ssr: true,
		});

		if(result.type === 'response') {
			return result.response;
		} else {
			const body = result.body;
			const headers = new Headers();
			const mimeType = mime.getType(url.pathname);
			if(mimeType) {
				headers.set('Content-Type', mimeType);
			}
			const bytes = this.#encoder.encode(body);
			headers.set('Content-Length', bytes.byteLength.toString());
			return new Response(bytes, {
				status: 200,
				headers
			});
		}
	}
}
