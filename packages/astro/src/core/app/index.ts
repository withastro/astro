import type { ComponentInstance, ManifestData, RouteData, SSRLoadedRenderer } from '../../@types/astro';
import type { SSRManifest as Manifest, RouteInfo } from './types';

import { defaultLogOptions } from '../logger.js';
export { deserializeManifest } from './common.js';
import { matchRoute } from '../routing/match.js';
import { render } from '../render/core.js';
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
		this
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

		const manifest = this.#manifest;
		const info = this.#routeDataToRouteInfo.get(routeData!)!;
		const mod = this.#manifest.pageMap.get(routeData.component)!;
		const renderers = this.#manifest.renderers;

		const url = new URL(request.url);
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
}
