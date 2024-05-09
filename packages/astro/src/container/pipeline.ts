import { type HeadElements, Pipeline } from '../core/base-pipeline.js';
import type {
	ComponentInstance,
	RewritePayload,
	RouteData,
	SSRElement,
	SSRResult,
} from '../@types/astro.js';
import {
	createModuleScriptElement,
	createStylesheetElementSet,
} from '../core/render/ssr-element.js';
import { AstroError } from '../core/errors/index.js';
import { RouteNotFound } from '../core/errors/errors-data.js';
import type { SinglePageBuiltModule } from '../core/build/types.js';

export class TestPipeline extends Pipeline {
	/**
	 *
	 * @private
	 */
	#componentsInterner: WeakMap<RouteData, SinglePageBuiltModule> = new WeakMap<
		RouteData,
		SinglePageBuiltModule
	>();
	/**
	 * This cache is needed to map a single `RouteData` to its file path.
	 * @private
	 */
	#routesByFilePath: WeakMap<RouteData, string> = new WeakMap<RouteData, string>();

	static create({
		logger,
		manifest,
		renderers,
		resolve,
		serverLike,
		streaming,
	}: Pick<
		TestPipeline,
		'logger' | 'manifest' | 'renderers' | 'resolve' | 'serverLike' | 'streaming'
	>) {
		return new TestPipeline(
			logger,
			manifest,
			'development',
			renderers,
			resolve,
			serverLike,
			streaming
		);
	}

	componentMetadata(_routeData: RouteData): Promise<SSRResult['componentMetadata']> | void {}

	headElements(routeData: RouteData): Promise<HeadElements> | HeadElements {
		const routeInfo = this.manifest.routes.find((route) => route.routeData === routeData);
		const links = new Set<never>();
		const scripts = new Set<SSRElement>();
		const styles = createStylesheetElementSet(routeInfo?.styles ?? []);

		for (const script of routeInfo?.scripts ?? []) {
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
		return { links, styles, scripts };
	}

	async tryRewrite(rewritePayload: RewritePayload): Promise<[RouteData, ComponentInstance]> {
		let foundRoute: RouteData | undefined;
		// options.manifest is the actual type that contains the information
		for (const route of this.manifest.routes) {
			const routeData = route.routeData;
			if (rewritePayload instanceof URL) {
				if (routeData.pattern.test(rewritePayload.pathname)) {
					foundRoute = routeData;
					break;
				}
			} else if (rewritePayload instanceof Request) {
				const url = new URL(rewritePayload.url);
				if (routeData.pattern.test(url.pathname)) {
					foundRoute = routeData;
					break;
				}
			} else if (routeData.pattern.test(decodeURI(rewritePayload))) {
				foundRoute = routeData;
				break;
			}
		}
		if (foundRoute) {
			const componentInstance = await this.getComponentByRoute(foundRoute);
			return [foundRoute, componentInstance];
		} else {
			throw new AstroError(RouteNotFound);
		}
	}
	
	async insertRoute(route: RouteData, componentInstance: ComponentInstance): Promise<void> {
		this.#componentsInterner.set(route, {
			page() {return  Promise.resolve(componentInstance)},
			renderers: this.manifest.renderers,
			onRequest: this.manifest.middleware
		})
	}

	async getComponentByRoute(routeData: RouteData): Promise<ComponentInstance> {
		if (this.#componentsInterner.has(routeData)) {
			// SAFETY: checked before
			const entry = this.#componentsInterner.get(routeData)!;
			return await entry.page();
		} else {
			// SAFETY: the pipeline calls `retrieveRoutesToGenerate`, which is in charge to fill the cache.
			const filePath = this.#routesByFilePath.get(routeData)!;
			const module = await this.#retrieveSsrEntry(routeData, filePath);
			return module.page();
		}
	}

	async #retrieveSsrEntry(route: RouteData, filePath: string): Promise<SinglePageBuiltModule> {
		if (this.#componentsInterner.has(route)) {
			// SAFETY: it is checked inside the if
			return this.#componentsInterner.get(route)!;
		}
		let entry;
		// if (routeIsRedirect(route)) {
		// entry = await this.#createEntryURL(route, this.internals, this.outFolder);
		// } else if (routeIsFallback(route)) {
		// entry = await this.#getEntryForFallbackRoute(route, this.internals, this.outFolder);
		// } else {
		const ssrEntryURLPage = this.#createEntryURL(filePath, new URL(process.cwd()));
		entry = await import(ssrEntryURLPage.toString());
		// }
		this.#componentsInterner.set(route, entry);
		return entry;
	}

	#createEntryURL(filePath: string, outFolder: URL) {
		return new URL('./' + filePath + `?time=${Date.now()}`, outFolder);
	}
}
