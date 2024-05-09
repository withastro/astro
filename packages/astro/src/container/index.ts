import type {
	AstroConfig,
	ComponentInstance,
	MiddlewareHandler,
	RouteData,
	RouteType,
	RuntimeMode,
	SSRElement,
	SSRLoadedRenderer,
	SSRManifest,
	SSRResult,
} from '../@types/astro.js';
import { TestPipeline } from './pipeline.js';
import { Logger } from '../core/logger/core.js';
import { nodeLogDestination } from '../core/logger/node.js';
import type { RouteInfo, SSRManifestI18n } from '../core/app/types.js';
import { toRoutingStrategy } from '../i18n/utils.js';
import type { AstroUserConfig } from '../../config.js';
import { validateConfig } from '../core/config/config.js';
import { ASTRO_CONFIG_DEFAULTS } from '../core/config/schema.js';
import { RenderContext } from '../core/render-context.js';
import { posix } from 'node:path';
import { getParts, getPattern, validateSegment } from '../core/routing/manifest/create.js';
import { removeLeadingForwardSlash } from '../core/path.js';

/**
 * Options to be passed when rendering a route
 */
export type ContainerRenderOptions = {
	/**
	 * If your component renders slots, that's where you want to fill the slots
	 */
	slots?: Record<string, any>;
	request?: Request;
	params?: string[];
	locals?: App.Locals;
	status?: number;
	routeType?: RouteType;
	scripts?: RouteInfo['scripts'];
};

/**
 * @param renderers
 * @param config
 * @param middleware
 */
function createContainerManifest(
	renderers: SSRLoadedRenderer[],
	config: AstroConfig,
	middleware?: MiddlewareHandler
): SSRManifest {
	let i18nManifest: SSRManifestI18n | undefined = undefined;
	if (config?.i18n) {
		i18nManifest = {
			fallback: config?.i18n.fallback,
			strategy: toRoutingStrategy(config?.i18n.routing, config?.i18n.domains),
			defaultLocale: config?.i18n.defaultLocale,
			locales: config?.i18n.locales,
			domainLookupTable: {},
		};
	}
	const defaultMiddleware: MiddlewareHandler = (_, next) => {
		return next();
	};
	return {
		rewritingEnabled: false,
		trailingSlash: config?.trailingSlash,
		buildFormat: config?.build.format,
		compressHTML: config?.compressHTML,
		assets: new Set(),
		entryModules: {},
		routes: [],
		adapterName: '',
		clientDirectives: new Map(),
		renderers,
		base: config?.base,
		assetsPrefix: config?.build.assetsPrefix,
		site: config?.site,
		componentMetadata: new Map(),
		inlinedScripts: new Map(),
		i18n: i18nManifest,
		checkOrigin: config?.experimental.security?.csrfProtection?.origin ?? false,
		middleware: middleware ?? defaultMiddleware,
	};
}

type AstroContainerOptions = {
	mode?: RuntimeMode;
	streaming?: boolean;
	renderers?: SSRLoadedRenderer[];
	astroConfig?: AstroUserConfig;
	middleware?: MiddlewareHandler;
	resolve?: SSRResult['resolve'];
};

export class unstable_AstroContainer {
	#pipeline: TestPipeline;
	#config: AstroConfig;

	private constructor(
		streaming: boolean,
		renderers: SSRLoadedRenderer[],
		config: AstroConfig,
		resolve?: SSRResult['resolve']
	) {
		this.#config = config;
		this.#pipeline = TestPipeline.create({
			logger: new Logger({
				level: 'info',
				dest: nodeLogDestination,
			}),
			manifest: createContainerManifest(renderers, config),
			streaming,
			serverLike: true,
			renderers,
			resolve: async (specifier: string) => {
				if (resolve) {
					return resolve(specifier);
				} else {
					return this.containerResolve(specifier);
				}
			},
		});
	}

	async containerResolve(_specifier: string): Promise<string> {
		return '';
	}

	static async create(
		containerOptions: AstroContainerOptions = {}
	): Promise<unstable_AstroContainer> {
		const {
			astroConfig = ASTRO_CONFIG_DEFAULTS,
			streaming = false,
			renderers = [],
			resolve,
		} = containerOptions;
		const config = await validateConfig(astroConfig, process.cwd(), 'container');
		return new unstable_AstroContainer(streaming, renderers, config, resolve);
	}

	insertRoute({
		path,
		componentInstance,
		params = [],
		type = 'page',
		scripts = [],
	}: {
		path: string;
		componentInstance: ComponentInstance;
		params?: string[];
		type?: RouteType;
		scripts?: RouteInfo['scripts'];
	}): RouteData {
		const pathUrl = new URL(path, 'https://example.com');
		const routeData: RouteData = this.createRoute(pathUrl, params, type);
		this.#pipeline.manifest.routes.push({
			routeData,
			file: '',
			links: [],
			styles: [],
			scripts,
		});
		this.#pipeline.insertRoute(routeData, componentInstance);
		return routeData;
	}

	async renderToString(
		component: ComponentInstance,
		options: ContainerRenderOptions = {}
	): Promise<string> {
		const response = await this.renderToResponse(component, options);
		return await response.text();
	}

	async renderToResponse(
		component: ComponentInstance,
		options: ContainerRenderOptions = {}
	): Promise<Response> {
		const { routeType = 'page', slots } = options;
		const request = options?.request ?? new Request('https://example.com/');
		const params = options?.params ?? [];
		const url = new URL(request.url);
		const routeData = this.insertRoute({
			path: request.url,
			componentInstance: component,
			scripts: options.scripts,
			params,
			type: routeType
		});
		const renderContext = RenderContext.create({
			pipeline: this.#pipeline,
			routeData,
			status: options?.status ?? 200,
			middleware: this.#pipeline.middleware,
			request,
			pathname: url.pathname,
			locals: options?.locals ?? {},
		});

		return renderContext.render(component, slots);
	}

	createRoute(url: URL, params: string[], type: RouteType): RouteData {
		const segments = removeLeadingForwardSlash(url.pathname)
			.split(posix.sep)
			.filter(Boolean)
			.map((s: string) => {
				validateSegment(s);
				return getParts(s, url.pathname);
			});
		return {
			component: '',
			generate(_data: any): string {
				return '';
			},
			params,
			pattern: getPattern(segments, this.#config, this.#config.trailingSlash),
			prerender: false,
			segments,
			type,
			route: url.pathname,
			fallbackRoutes: [],
			isIndex: false,
		};
	}
}
