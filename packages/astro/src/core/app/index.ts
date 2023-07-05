import mime from 'mime';
import type {
	EndpointHandler,
	ManifestData,
	MiddlewareResponseHandler,
	RouteData,
	SSRElement,
	SSRManifest,
} from '../../@types/astro';
import type { SinglePageBuiltModule } from '../build/types';
import { attachToResponse, getSetCookiesFromResponse } from '../cookies/index.js';
import { callEndpoint, createAPIContext } from '../endpoint/index.js';
import { consoleLogDestination } from '../logger/console.js';
import { error, type LogOptions } from '../logger/core.js';
import { callMiddleware } from '../middleware/callMiddleware.js';
import { prependForwardSlash, removeTrailingForwardSlash } from '../path.js';
import { RedirectSinglePageBuiltModule } from '../redirects/index.js';
import {
	createEnvironment,
	createRenderContext,
	renderPage,
	type Environment,
} from '../render/index.js';
import { RouteCache } from '../render/route-cache.js';
import {
	createAssetLink,
	createModuleScriptElement,
	createStylesheetElementSet,
} from '../render/ssr-element.js';
import { matchRoute } from '../routing/match.js';
import type { RouteInfo } from './types';
export { deserializeManifest } from './common.js';

const clientLocalsSymbol = Symbol.for('astro.locals');

const responseSentSymbol = Symbol.for('astro.responseSent');

export interface MatchOptions {
	matchNotFound?: boolean | undefined;
}

export class App {
	#env: Environment;
	#manifest: SSRManifest;
	#manifestData: ManifestData;
	#routeDataToRouteInfo: Map<RouteData, RouteInfo>;
	#encoder = new TextEncoder();
	#logging: LogOptions = {
		dest: consoleLogDestination,
		level: 'info',
	};
	#base: string;
	#baseWithoutTrailingSlash: string;

	constructor(manifest: SSRManifest, streaming = true) {
		this.#manifest = manifest;
		this.#manifestData = {
			routes: manifest.routes.map((route) => route.routeData),
		};
		this.#routeDataToRouteInfo = new Map(manifest.routes.map((route) => [route.routeData, route]));
		this.#env = createEnvironment({
			adapterName: manifest.adapterName,
			logging: this.#logging,
			markdown: manifest.markdown,
			mode: 'production',
			renderers: manifest.renderers,
			clientDirectives: manifest.clientDirectives,
			async resolve(specifier: string) {
				if (!(specifier in manifest.entryModules)) {
					throw new Error(`Unable to resolve [${specifier}]`);
				}
				const bundlePath = manifest.entryModules[specifier];
				switch (true) {
					case bundlePath.startsWith('data:'):
					case bundlePath.length === 0: {
						return bundlePath;
					}
					default: {
						return createAssetLink(bundlePath, manifest.base, manifest.assetsPrefix);
					}
				}
			},
			routeCache: new RouteCache(this.#logging),
			site: this.#manifest.site,
			ssr: true,
			streaming,
		});

		this.#base = this.#manifest.base || '/';
		this.#baseWithoutTrailingSlash = removeTrailingForwardSlash(this.#base);
	}
	removeBase(pathname: string) {
		if (pathname.startsWith(this.#base)) {
			return pathname.slice(this.#baseWithoutTrailingSlash.length + 1);
		}
		return pathname;
	}
	match(request: Request, { matchNotFound = false }: MatchOptions = {}): RouteData | undefined {
		const url = new URL(request.url);
		// ignore requests matching public assets
		if (this.#manifest.assets.has(url.pathname)) {
			return undefined;
		}
		let pathname = prependForwardSlash(this.removeBase(url.pathname));
		let routeData = matchRoute(pathname, this.#manifestData);

		if (routeData) {
			if (routeData.prerender) return undefined;
			return routeData;
		} else if (matchNotFound) {
			const notFoundRouteData = matchRoute('/404', this.#manifestData);
			if (notFoundRouteData?.prerender) return undefined;
			return notFoundRouteData;
		} else {
			return undefined;
		}
	}
	async render(request: Request, routeData?: RouteData, locals?: object): Promise<Response> {
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

		Reflect.set(request, clientLocalsSymbol, locals ?? {});

		// Use the 404 status code for 404.astro components
		if (routeData.route === '/404') {
			defaultStatus = 404;
		}

		let mod = await this.#getModuleForRoute(routeData);

		if (routeData.type === 'page' || routeData.type === 'redirect') {
			let response = await this.#renderPage(request, routeData, mod, defaultStatus);

			// If there was a known error code, try sending the according page (e.g. 404.astro / 500.astro).
			if (response.status === 500 || response.status === 404) {
				const errorRouteData = matchRoute('/' + response.status, this.#manifestData);
				if (errorRouteData && errorRouteData.route !== routeData.route) {
					mod = await this.#getModuleForRoute(errorRouteData);
					try {
						let errorResponse = await this.#renderPage(
							request,
							errorRouteData,
							mod,
							response.status
						);
						return errorResponse;
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

	setCookieHeaders(response: Response) {
		return getSetCookiesFromResponse(response);
	}

	async #getModuleForRoute(route: RouteData): Promise<SinglePageBuiltModule> {
		if (route.type === 'redirect') {
			return RedirectSinglePageBuiltModule;
		} else {
			if (this.#manifest.pageMap) {
				const importComponentInstance = this.#manifest.pageMap.get(route.component);
				if (!importComponentInstance) {
					throw new Error(
						`Unexpectedly unable to find a component instance for route ${route.route}`
					);
				}
				const pageModule = await importComponentInstance();
				return pageModule;
			} else if (this.#manifest.pageModule) {
				const importComponentInstance = this.#manifest.pageModule;
				return importComponentInstance;
			} else {
				throw new Error(
					"Astro couldn't find the correct page to render, probably because it wasn't correctly mapped for SSR usage. This is an internal error, please file an issue."
				);
			}
		}
	}

	async #renderPage(
		request: Request,
		routeData: RouteData,
		page: SinglePageBuiltModule,
		status = 200
	): Promise<Response> {
		const url = new URL(request.url);
		const pathname = prependForwardSlash(this.removeBase(url.pathname));
		const info = this.#routeDataToRouteInfo.get(routeData)!;
		const isCompressHTML = this.#manifest.compressHTML ?? false;
		// may be used in the future for handling rel=modulepreload, rel=icon, rel=manifest etc.
		const links = new Set<never>();
		const styles = createStylesheetElementSet(info.styles);

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
				scripts.add(createModuleScriptElement(script));
			}
		}

		try {
			const mod = (await page.page()) as any;
			const renderContext = await createRenderContext({
				request,
				pathname,
				componentMetadata: this.#manifest.componentMetadata,
				scripts,
				styles,
				links,
				route: routeData,
				status,
				mod,
				env: this.#env,
			});

			const apiContext = createAPIContext({
				request: renderContext.request,
				params: renderContext.params,
				props: renderContext.props,
				site: this.#env.site,
				adapterName: this.#env.adapterName,
			});
			let response;
			if (page.onRequest) {
				response = await callMiddleware<Response>(
					this.#env.logging,
					page.onRequest as MiddlewareResponseHandler,
					apiContext,
					() => {
						return renderPage({
							mod,
							renderContext,
							env: this.#env,
							cookies: apiContext.cookies,
							isCompressHTML,
						});
					}
				);
			} else {
				response = await renderPage({
					mod,
					renderContext,
					env: this.#env,
					cookies: apiContext.cookies,
					isCompressHTML,
				});
			}
			Reflect.set(request, responseSentSymbol, true);
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
		page: SinglePageBuiltModule,
		status = 200
	): Promise<Response> {
		const url = new URL(request.url);
		const pathname = '/' + this.removeBase(url.pathname);
		const mod = await page.page();
		const handler = mod as unknown as EndpointHandler;

		const ctx = await createRenderContext({
			request,
			pathname,
			route: routeData,
			status,
			env: this.#env,
			mod: handler as any,
		});

		const result = await callEndpoint(handler, this.#env, ctx, this.#logging, page.onRequest);

		if (result.type === 'response') {
			if (result.response.headers.get('X-Astro-Response') === 'Not-Found') {
				const fourOhFourRequest = new Request(new URL('/404', request.url));
				const fourOhFourRouteData = this.match(fourOhFourRequest);
				if (fourOhFourRouteData) {
					return this.render(fourOhFourRequest, fourOhFourRouteData);
				}
			}
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

			const response = new Response(bytes, {
				status: 200,
				headers,
			});

			attachToResponse(response, result.cookies);
			return response;
		}
	}
}
