import type {
	AstroConfig,
	ComponentInstance,
	RouteData,
	RuntimeMode,
	SSRLoadedRenderer,
	SSRManifest,
} from '../@types/astro.js';
import { TestPipeline } from './pipeline.js';
import { Logger } from '../core/logger/core.js';
import { nodeLogDestination } from '../core/logger/node.js';
import type { SSRManifestI18n } from '../core/app/types.js';
import { toRoutingStrategy } from '../i18n/utils.js';
import type { AstroUserConfig } from '../../config.js';
import { validateConfig } from '../core/config/config.js';
import { ASTRO_CONFIG_DEFAULTS } from '../core/config/schema.js';
import { RenderContext } from '../core/render-context.js';
import path from 'node:path';
import { getParts, getPattern, validateSegment } from '../core/routing/manifest/create.js';
import { removeLeadingForwardSlash } from '../core/path.js';
import { isServerLikeOutput } from '../prerender/utils.js';

type ContainerOptions = {
	slots?: string[];
	request?: Request;
	params?: string[];
};

/**
 * @param renderers
 * @param config
 */
function createContainerManifest(renderers: SSRLoadedRenderer[], config: AstroConfig): SSRManifest {
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
	return {
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
		middleware(_, next) {
			return next();
		},
	};
}

type AstroContainerOptions = {
	mode: RuntimeMode;
	streaming: boolean;
	renderers: SSRLoadedRenderer[];
	astroConfig: AstroUserConfig;
};

export class unstable_AstroContainer {
	#pipeline: TestPipeline;
	#config: AstroConfig;

	constructor(
		mode: RuntimeMode,
		streaming: boolean,
		renderers: SSRLoadedRenderer[],
		config: AstroConfig
	) {
		this.#config = config;
		this.#pipeline = TestPipeline.create({
			logger: new Logger({
				level: 'info',
				dest: nodeLogDestination,
			}),
			mode: 'development',
			manifest: createContainerManifest(renderers, config),
			streaming,
			serverLike: isServerLikeOutput(config),
			renderers,
			resolve: async (_specifier: string) => {
				// TODO: to implement somehow
				return '';
			},
		});
	}

	static async create(containerOptions: AstroContainerOptions): Promise<unstable_AstroContainer> {
		const { astroConfig = ASTRO_CONFIG_DEFAULTS, mode, streaming, renderers } = containerOptions;
		const config = await validateConfig(astroConfig, process.cwd(), 'container');
		return new unstable_AstroContainer(mode, streaming, renderers, config);
	}

	async renderToString(
		component: ComponentInstance,
		options: ContainerOptions = {}
	): Promise<string> {
		const request = options?.request ?? new Request('https://example.com/');
		const params = options?.params ?? [];
		const url = new URL(request.url);
		const renderContext = RenderContext.create({
			pipeline: this.#pipeline,
			routeData: this.createRoute(url, params),
			status: 200,
			middleware: this.#pipeline.middleware,
			request,
			pathname: url.pathname,
		});

		const response = await renderContext.render(component);
		return await response.text();
	}

	createRoute(url: URL, params: string[]): RouteData {
		const segments = removeLeadingForwardSlash(url.pathname)
			.split(path.posix.sep)
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
			type: 'page',
			route: url.pathname,
			fallbackRoutes: [],
			isIndex: false,
		};
	}
}
