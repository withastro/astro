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

export interface MatchOptions {
	matchNotFound?: boolean | undefined;
}

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
	match(request: Request, { matchNotFound = false }: MatchOptions = {}): RouteData | undefined {
		const url = new URL(request.url);
		// ignore requests matching public assets
		if (this.#manifest.assets.has(url.pathname)) {
			return undefined;
		}
		let routeData = matchRoute(url.pathname, this.#manifestData);

		if (routeData) {
			return routeData;
		} else if (matchNotFound) {
			return matchRoute('/404', this.#manifestData);
		} else {
			return undefined;
		}
	}
	async render(request: Request, routeData?: RouteData): Promise<Response> {
		let defaultStatus = 200;
		if (!routeData) {
			routeData = this.match(request);
			if (!routeData) {
				defaultStatus = 404;
				routeData = this.match(request, { matchNotFound: true });
			}
			if (!routeData) {
				return new Response(null, {
					status: 404,
					statusText: 'Not found',
				});
			}
		}

		// Use the 404 status code for 404.astro components
		if (routeData.route === '/404') {
			defaultStatus = 404;
		}

		let mod = this.#manifest.pageMap.get(routeData.component)!;

		if (routeData.type === 'page') {
			let response = await this.#renderPage(request, routeData, mod, defaultStatus);

			// If there was a 500 error, try sending the 500 page.
			if (response.status === 500) {
				const fiveHundredRouteData = matchRoute('/500', this.#manifestData);
				if (fiveHundredRouteData) {
					mod = this.#manifest.pageMap.get(fiveHundredRouteData.component)!;
					try {
						let fiveHundredResponse = await this.#renderPage(
							request,
							fiveHundredRouteData,
							mod,
							500
						);
						return fiveHundredResponse;
					} catch {}
				}
			}
			return response;
		} else if (routeData.type === 'endpoint') {
			return this.#callEndpoint(request, routeData, mod, defaultStatus);
		} else {
			throw new Error(`Unsupported route type [${routeData.type}].`);
		}
	}

	async #renderPage(
		request: Request,
		routeData: RouteData,
		mod: ComponentInstance,
		status = 200
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
				status,
			});

			return response;
		} catch (err: any) {
			error(this.#logging, 'ssr', err.stack || err.message || String(err));
			return new Response(null, {
				status: 500,
				statusText: 'Internal server error',
			});
		}
	}

	async #callEndpoint(
		request: Request,
		routeData: RouteData,
		mod: ComponentInstance,
		status = 200
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
			status,
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
