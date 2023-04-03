import { fileURLToPath } from 'url';
import type {
	AstroMiddlewareInstance,
	AstroSettings,
	ComponentInstance,
	MiddlewareHandler,
	MiddlewareResolve,
	RouteData,
	SSRElement,
	SSRLoadedRenderer,
} from '../../../@types/astro';
import { PAGE_SCRIPT_ID } from '../../../vite-plugin-scripts/index.js';
import { enhanceViteSSRError } from '../../errors/dev/index.js';
import {
	AggregateError,
	AstroError,
	AstroErrorData,
	CSSError,
	MarkdownError,
} from '../../errors/index.js';
import type { ModuleLoader } from '../../module-loader/index';
import { isPage, resolveIdToUrl, viteID } from '../../util.js';
import {
	createRenderContext,
	getParamsAndProps,
	GetParamsAndPropsError,
	renderPage as coreRenderPage,
} from '../index.js';
import { filterFoundRenderers, loadRenderer } from '../renderer.js';
import { getStylesForURL } from './css.js';
import type { DevelopmentEnvironment } from './environment';
import { getComponentMetadata } from './metadata.js';
import { getScriptsForURL } from './scripts.js';
import { createAPIContext } from '../../endpoint/index.js';
import { sequence } from '../../middleware/sequence.js';
export { createDevelopmentEnvironment } from './environment.js';
export type { DevelopmentEnvironment };

export interface SSROptions {
	/** The environment instance */
	env: DevelopmentEnvironment;
	/** location of file on disk */
	filePath: URL;
	/** production website */
	origin: string;
	/** the web request (needed for dynamic routes) */
	pathname: string;
	/** The renderers and instance */
	preload: ComponentPreload;
	/** Request */
	request: Request;
	/** optional, in case we need to render something outside of a dev server */
	route?: RouteData;
	/**
	 * Optional middlewares
	 */
	middleware?: AstroMiddlewareInstance;
}

export type ComponentPreload = [SSRLoadedRenderer[], ComponentInstance];

export async function loadRenderers(
	moduleLoader: ModuleLoader,
	settings: AstroSettings
): Promise<SSRLoadedRenderer[]> {
	const loader = (entry: string) => moduleLoader.import(entry);
	const renderers = await Promise.all(settings.renderers.map((r) => loadRenderer(r, loader)));
	return filterFoundRenderers(renderers);
}

export async function preload({
	env,
	filePath,
}: Pick<SSROptions, 'env' | 'filePath'>): Promise<ComponentPreload> {
	// Important: This needs to happen first, in case a renderer provides polyfills.
	const renderers = await loadRenderers(env.loader, env.settings);

	try {
		// Load the module from the Vite SSR Runtime.
		const mod = (await env.loader.import(fileURLToPath(filePath))) as ComponentInstance;
		return [renderers, mod];
	} catch (error) {
		// If the error came from Markdown or CSS, we already handled it and there's no need to enhance it
		if (MarkdownError.is(error) || CSSError.is(error) || AggregateError.is(error)) {
			throw error;
		}

		throw enhanceViteSSRError({ error, filePath, loader: env.loader, renderers });
	}
}

interface GetScriptsAndStylesParams {
	env: DevelopmentEnvironment;
	filePath: URL;
}

async function getScriptsAndStyles({ env, filePath }: GetScriptsAndStylesParams) {
	// Add hoisted script tags
	const scripts = await getScriptsForURL(filePath, env.settings.config.root, env.loader);

	// Inject HMR scripts
	if (isPage(filePath, env.settings) && env.mode === 'development') {
		scripts.add({
			props: { type: 'module', src: '/@vite/client' },
			children: '',
		});
		scripts.add({
			props: {
				type: 'module',
				src: await resolveIdToUrl(env.loader, 'astro/runtime/client/hmr.js'),
			},
			children: '',
		});
	}

	// TODO: We should allow adding generic HTML elements to the head, not just scripts
	for (const script of env.settings.scripts) {
		if (script.stage === 'head-inline') {
			scripts.add({
				props: {},
				children: script.content,
			});
		} else if (script.stage === 'page' && isPage(filePath, env.settings)) {
			scripts.add({
				props: { type: 'module', src: `/@id/${PAGE_SCRIPT_ID}` },
				children: '',
			});
		}
	}

	// Pass framework CSS in as style tags to be appended to the page.
	const { urls: styleUrls, stylesMap } = await getStylesForURL(filePath, env.loader, env.mode);
	let links = new Set<SSRElement>();
	[...styleUrls].forEach((href) => {
		links.add({
			props: {
				rel: 'stylesheet',
				href,
			},
			children: '',
		});
	});

	let styles = new Set<SSRElement>();
	[...stylesMap].forEach(([url, content]) => {
		// Vite handles HMR for styles injected as scripts
		scripts.add({
			props: {
				type: 'module',
				src: url,
			},
			children: '',
		});
		// But we still want to inject the styles to avoid FOUC
		styles.add({
			props: {
				type: 'text/css',
				// Track the ID so we can match it to Vite's injected style later
				'data-astro-dev-id': viteID(new URL(`.${url}`, env.settings.config.root)),
			},
			children: content,
		});
	});

	const metadata = await getComponentMetadata(filePath, env.loader);

	return { scripts, styles, links, metadata };
}

export async function renderPage(options: SSROptions): Promise<Response> {
	const [renderers, mod] = options.preload;

	// Override the environment's renderers. This ensures that if renderers change (HMR)
	// The new instances are passed through.
	options.env.renderers = renderers;

	const { scripts, links, styles, metadata } = await getScriptsAndStyles({
		env: options.env,
		filePath: options.filePath,
	});

	const ctx = createRenderContext({
		request: options.request,
		origin: options.origin,
		pathname: options.pathname,
		scripts,
		links,
		styles,
		componentMetadata: metadata,
		route: options.route,
	});

	if (options.middleware) {
		const { env } = options;
		const paramsAndPropsRes = await getParamsAndProps({
			logging: env.logging,
			mod,
			route: ctx.route,
			routeCache: env.routeCache,
			pathname: ctx.pathname,
			ssr: env.ssr,
		});

		if (paramsAndPropsRes === GetParamsAndPropsError.NoMatchingStaticPath) {
			throw new AstroError({
				...AstroErrorData.NoMatchingStaticPathFound,
				message: AstroErrorData.NoMatchingStaticPathFound.message(ctx.pathname),
				hint: ctx.route?.component
					? AstroErrorData.NoMatchingStaticPathFound.hint([ctx.route?.component])
					: '',
			});
		}
		const [params, pageProps] = paramsAndPropsRes;

		const apiContext = createAPIContext({
			request: options.request,
			params,
			props: pageProps,
			adapterName: options.env.adapterName,
		});

		let onRequestHandler: MiddlewareHandler | undefined = undefined;
		const { onRequest } = options.middleware;
		if (onRequest) {
			onRequestHandler = onRequest;
		} else {
			throw new AstroError({
				...AstroErrorData.MiddlewareOnRequestNotFound,
			});
		}
		let resolveResolve: any;
		new Promise((resolve) => {
			resolveResolve = resolve;
		});

		let resolveCalledResolve: any;
		let resolveCalled = new Promise((resolve) => {
			resolveCalledResolve = resolve;
		});
		const resolve: MiddlewareResolve = (context) => {
			const response = coreRenderPage(mod, ctx, options.env, apiContext);
			resolveCalledResolve('resolveCalled');
			return response;
		};

		let middlewarePromise = onRequestHandler(apiContext, resolve);

		let response = await Promise.race([middlewarePromise, resolveCalled]).then(async (value) => {
			if (value === 'resolveCalled') {
				// Middleware called resolve()
				// render the page and then pass back to middleware
				// for post-processing
				const responseResult = await coreRenderPage(mod, ctx, options.env, apiContext);
				await resolveResolve(responseResult);
				return middlewarePromise;
			} else {
				// Middleware did not call resolve()
				return await coreRenderPage(mod, ctx, options.env, apiContext);
			}
		});

		return response;
	}
	return await coreRenderPage(mod, ctx, options.env); // NOTE: without "await", errors won’t get caught below
}
