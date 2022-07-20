import type {
	ComponentInstance,
	EndpointHandler,
	ManifestData,
	RouteData,
	SSRElement,
} from '../../@types/astro';
import type { LogOptions } from '../logger/core.js';
import type { RouteInfo, SSRManifest as Manifest } from './types';

import mime from 'mime';
import { call as callEndpoint } from '../endpoint/index.js';
import { consoleLogDestination } from '../logger/console.js';
import { error } from '../logger/core.js';
import { joinPaths, prependForwardSlash } from '../path.js';
import { render } from '../render/core.js';
import { RouteCache } from '../render/route-cache.js';
import {
	createLinkStylesheetElementSet,
	createModuleScriptElement,
} from '../render/ssr-element.js';
import { matchRoute } from '../routing/match.js';
export { deserializeManifest } from './common.js';

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
	#streaming: boolean;

	constructor(manifest: Manifest, streaming = true) {
		this.#manifest = manifest;
		this.#manifestData = {
			routes: manifest.routes.map((route) => route.routeData),
		};
		this.#routeDataToRouteInfo = new Map(manifest.routes.map((route) => [route.routeData, route]));
		this.#routeCache = new RouteCache(this.#logging);
		this.#streaming = streaming;
	}
	match(request: Request): RouteData | undefined {
		const url = new URL(request.url);
		// ignore requests matching public assets
		if (this.#manifest.assets.has(url.pathname)) {
			return undefined;
		}
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

		let scripts = new Set<SSRElement>();
		for (const script of info.scripts) {
			if ('stage' in script) {
				if (script.stage === 'head-inline') {
					scripts.add({
						props: {},
						children: script.children,
					});
				}
			} else {
				scripts.add(createModuleScriptElement(script, manifest.site));
			}
		}

		try {
			const response = await render({
				adapterName: manifest.adapterName,
				links,
				logging: this.#logging,
				markdown: manifest.markdown,
				mod,
				mode: 'production',
				origin: url.origin,
				pathname: url.pathname,
				scripts,
				renderers,
				async resolve(specifier: string) {
					if (!(specifier in manifest.entryModules)) {
						throw new Error(`Unable to resolve [${specifier}]`);
					}
					const bundlePath = manifest.entryModules[specifier];
					return bundlePath.startsWith('data:')
						? bundlePath
						: prependForwardSlash(joinPaths(manifest.base, bundlePath));
				},
				route: routeData,
				routeCache: this.#routeCache,
				site: this.#manifest.site,
				ssr: true,
				request,
				streaming: this.#streaming,
			});

			return response;
		} catch (err) {
			error(this.#logging, 'ssr', err);
			return new Response(null, {
				status: 500,
				statusText: 'Internal server error',
			});
		}
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
				headers.set('Content-Type', `${mimeType};charset=utf-8`);
			} else {
				headers.set('Content-Type', 'text/plain;charset=utf-8');
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
