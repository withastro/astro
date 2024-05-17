import { fileURLToPath } from 'node:url';
import type {
	AstroSettings,
	ComponentInstance,
	DevToolbarMetadata,
	ManifestData,
	RewritePayload,
	RouteData,
	SSRElement,
	SSRLoadedRenderer,
	SSRManifest,
} from '../@types/astro.js';
import { getInfoOutput } from '../cli/info/index.js';
import type { HeadElements } from '../core/base-pipeline.js';
import { ASTRO_VERSION, DEFAULT_404_COMPONENT } from '../core/constants.js';
import { enhanceViteSSRError } from '../core/errors/dev/index.js';
import { RouteNotFound } from '../core/errors/errors-data.js';
import { AggregateError, AstroError, CSSError, MarkdownError } from '../core/errors/index.js';
import type { Logger } from '../core/logger/core.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import { Pipeline, loadRenderer } from '../core/render/index.js';
import { isPage, isServerLikeOutput, resolveIdToUrl, viteID } from '../core/util.js';
import { PAGE_SCRIPT_ID } from '../vite-plugin-scripts/index.js';
import { getStylesForURL } from './css.js';
import { getComponentMetadata } from './metadata.js';
import { createResolve } from './resolve.js';
import { default404Page } from './response.js';
import { getScriptsForURL } from './scripts.js';

export class DevPipeline extends Pipeline {
	// renderers are loaded on every request,
	// so it needs to be mutable here unlike in other environments
	override renderers = new Array<SSRLoadedRenderer>();

	manifestData: ManifestData | undefined;

	componentInterner: WeakMap<RouteData, ComponentInstance> = new WeakMap<
		RouteData,
		ComponentInstance
	>();

	private constructor(
		readonly loader: ModuleLoader,
		readonly logger: Logger,
		readonly manifest: SSRManifest,
		readonly settings: AstroSettings,
		readonly config = settings.config
	) {
		const mode = 'development';
		const resolve = createResolve(loader, config.root);
		const serverLike = isServerLikeOutput(config);
		const streaming = true;
		super(logger, manifest, mode, [], resolve, serverLike, streaming);
	}

	static create(
		manifestData: ManifestData,
		{
			loader,
			logger,
			manifest,
			settings,
		}: Pick<DevPipeline, 'loader' | 'logger' | 'manifest' | 'settings'>
	) {
		const pipeline = new DevPipeline(loader, logger, manifest, settings);
		pipeline.manifestData = manifestData;
		return pipeline;
	}

	async headElements(routeData: RouteData): Promise<HeadElements> {
		const {
			config: { root },
			loader,
			mode,
			settings,
		} = this;
		const filePath = new URL(`${routeData.component}`, root);
		// Add hoisted script tags, skip if direct rendering with `directRenderScript`
		const { scripts } = settings.config.experimental.directRenderScript
			? { scripts: new Set<SSRElement>() }
			: await getScriptsForURL(filePath, settings.config.root, loader);

		// Inject HMR scripts
		if (isPage(filePath, settings) && mode === 'development') {
			scripts.add({
				props: { type: 'module', src: '/@vite/client' },
				children: '',
			});

			if (
				settings.config.devToolbar.enabled &&
				(await settings.preferences.get('devToolbar.enabled'))
			) {
				const src = await resolveIdToUrl(loader, 'astro/runtime/client/dev-toolbar/entrypoint.js');
				scripts.add({ props: { type: 'module', src }, children: '' });

				const additionalMetadata: DevToolbarMetadata['__astro_dev_toolbar__'] = {
					root: fileURLToPath(settings.config.root),
					version: ASTRO_VERSION,
					latestAstroVersion: settings.latestAstroVersion,
					debugInfo: await getInfoOutput({ userConfig: settings.config, print: false }),
				};

				// Additional data for the dev overlay
				const children = `window.__astro_dev_toolbar__ = ${JSON.stringify(additionalMetadata)}`;
				scripts.add({ props: {}, children });
			}
		}

		// TODO: We should allow adding generic HTML elements to the head, not just scripts
		for (const script of settings.scripts) {
			if (script.stage === 'head-inline') {
				scripts.add({
					props: {},
					children: script.content,
				});
			} else if (script.stage === 'page' && isPage(filePath, settings)) {
				scripts.add({
					props: { type: 'module', src: `/@id/${PAGE_SCRIPT_ID}` },
					children: '',
				});
			}
		}

		// Pass framework CSS in as style tags to be appended to the page.
		const links = new Set<SSRElement>();
		const { urls, styles: _styles } = await getStylesForURL(filePath, loader);
		for (const href of urls) {
			links.add({ props: { rel: 'stylesheet', href }, children: '' });
		}

		const styles = new Set<SSRElement>();
		for (const { id, url: src, content } of _styles) {
			// Vite handles HMR for styles injected as scripts
			scripts.add({ props: { type: 'module', src }, children: '' });
			// But we still want to inject the styles to avoid FOUC. The style tags
			// should emulate what Vite injects so further HMR works as expected.
			styles.add({ props: { 'data-vite-dev-id': id }, children: content });
		}

		return { scripts, styles, links };
	}

	componentMetadata(routeData: RouteData) {
		const {
			config: { root },
			loader,
		} = this;
		const filePath = new URL(`${routeData.component}`, root);
		return getComponentMetadata(filePath, loader);
	}

	async preload(routeData: RouteData, filePath: URL) {
		const { loader } = this;
		if (filePath.href === new URL(DEFAULT_404_COMPONENT, this.config.root).href) {
			return { default: default404Page } as any as ComponentInstance;
		}

		// Important: This needs to happen first, in case a renderer provides polyfills.
		const renderers__ = this.settings.renderers.map((r) => loadRenderer(r, loader));
		const renderers_ = await Promise.all(renderers__);
		this.renderers = renderers_.filter((r): r is SSRLoadedRenderer => Boolean(r));

		try {
			// Load the module from the Vite SSR Runtime.
			const componentInstance = (await loader.import(viteID(filePath))) as ComponentInstance;
			this.componentInterner.set(routeData, componentInstance);
			return componentInstance;
		} catch (error) {
			// If the error came from Markdown or CSS, we already handled it and there's no need to enhance it
			if (MarkdownError.is(error) || CSSError.is(error) || AggregateError.is(error)) {
				throw error;
			}

			throw enhanceViteSSRError({ error, filePath, loader });
		}
	}

	clearRouteCache() {
		this.routeCache.clearAll();
		this.componentInterner = new WeakMap<RouteData, ComponentInstance>();
	}

	async getComponentByRoute(routeData: RouteData): Promise<ComponentInstance> {
		const component = this.componentInterner.get(routeData);
		if (component) {
			return component;
		} else {
			const filePath = new URL(`${routeData.component}`, this.config.root);
			return await this.preload(routeData, filePath);
		}
	}

	async tryRewrite(
		payload: RewritePayload,
		request: Request
	): Promise<[RouteData, ComponentInstance]> {
		let foundRoute;
		if (!this.manifestData) {
			throw new Error('Missing manifest data. This is an internal error, please file an issue.');
		}

		for (const route of this.manifestData.routes) {
			if (payload instanceof URL) {
				if (route.pattern.test(payload.pathname)) {
					foundRoute = route;
					break;
				}
			} else if (payload instanceof Request) {
				const url = new URL(payload.url);
				if (route.pattern.test(url.pathname)) {
					foundRoute = route;
					break;
				}
			} else {
				const newUrl = new URL(payload, new URL(request.url).origin);
				if (route.pattern.test(decodeURI(newUrl.pathname))) {
					foundRoute = route;
					break;
				}
			}
		}

		if (foundRoute) {
			const componentInstance = await this.getComponentByRoute(foundRoute);
			return [foundRoute, componentInstance];
		} else {
			throw new AstroError(RouteNotFound);
		}
	}

	setManifestData(manifestData: ManifestData) {
		this.manifestData = manifestData;
	}
}
