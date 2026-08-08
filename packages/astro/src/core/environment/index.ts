import type { ComponentInstance } from '../../types/astro.js';
import type { RewritePayload } from '../../types/public/common.js';
import type { RuntimeMode } from '../../types/public/config.js';
import type {
	RouteData,
	SSRLoadedRenderer,
	SSRManifest,
	SSRResult,
} from '../../types/public/internal.js';
import type { LogRequestPayload } from '../app/base.js';
import type { SinglePageBuiltModule } from '../build/types.js';
import { productionEnvironment } from './production.js';

/**
 * The scripts, styles and links a rendering environment injects into a page's
 * head for a given route. (Rehomed here from the deleted Pipeline base class.)
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface HeadElements extends Pick<SSRResult, 'scripts' | 'styles' | 'links'> {}

/**
 * The result of a successful `tryRewrite` environment call.
 * (Rehomed here from the deleted Pipeline base class.)
 */
export interface TryRewriteResult {
	routeData: RouteData;
	componentInstance: ComponentInstance;
	newUrl: URL;
	pathname: string;
}

/**
 * The behavior that genuinely varies between rendering environments
 * (production SSR, the two dev paths, build/prerender, the container),
 * expressed as a stateless record of functions and static flags instead of a
 * class hierarchy with overridden methods.
 *
 * MEMBERSHIP CLAMP (review ruling A, normative):
 * (i)  No member may hold or close over an App/facade instance. Env-private
 *      services (ModuleLoader, BuildInternals, the container interner)
 *      captured at composition time are fine — they are environment
 *      composition, unreachable from requests.
 * (ii) Members are limited to the set below (the discovery override matrix)
 *      plus the error-strategy statics and `logRequest` (D2-justified: request
 *      logging is genuinely environment behavior — prod silent, dev request
 *      lines). Any further member requires justification against the
 *      discovery-app-pipeline §2.7 override matrix in the PR description.
 * (iii) The record stays stateless; per-manifest mutable state stays in
 *      owning-module WeakMaps.
 * Facade-INSTANCE behavior (anything whose contract is "the public method on
 * *this* App, as possibly overridden or reassigned") must NOT go here — it
 * travels per-request via the internal FetchState-constructor hooks on the
 * facade fast path. It must also NOT ride `ResolvedRenderOptions` (D1) and
 * NOT live in per-manifest registries (review ruling A).
 */
/**
 * The payload chain sites pass to request logging (`logRequestFromState`).
 * `reqTime` is computed by the receiver (facade `logThisRequest` or the env
 * record) from `timeStart`, matching today's `BaseApp.logThisRequest`.
 */
export type RequestLogPayload = Omit<LogRequestPayload, 'reqTime'> & { timeStart: number };

export interface RenderEnvironment {
	/** Debug label; replaces `Pipeline.getName()`. */
	readonly name: string;
	/** 'development' | 'production'; replaces `pipeline.runtimeMode`. */
	readonly runtimeMode: RuntimeMode;
	/** Default streaming when the facade hooks don't specify a flag. */
	defaultStreaming(manifest: SSRManifest): boolean;

	resolve(manifest: SSRManifest, specifier: string): Promise<string>;
	headElements(manifest: SSRManifest, routeData: RouteData): Promise<HeadElements> | HeadElements;
	componentMetadata(
		manifest: SSRManifest,
		routeData: RouteData,
	): Promise<SSRResult['componentMetadata']> | void;
	getComponentByRoute(manifest: SSRManifest, routeData: RouteData): Promise<ComponentInstance>;
	getModuleForRoute(manifest: SSRManifest, route: RouteData): Promise<SinglePageBuiltModule>;
	tryRewrite(
		manifest: SSRManifest,
		payload: RewritePayload,
		request: Request,
	): Promise<TryRewriteResult>;
	/** Renderers for `createResult`. Sync, like today's `pipeline.renderers` read. */
	getRenderers(manifest: SSRManifest): SSRLoadedRenderer[];

	// Error-strategy STATICS (review ruling A; strategy design owned by the
	// handler-core chunk):
	/** Which error-page strategy `renderErrorPage` dispatches to. */
	readonly errorStrategy: 'default' | 'dev' | 'build';
	/** Dev-only CSP meta-tag injection flag for error pages. */
	readonly injectCspMetaTagsOnErrorPages: boolean;
	/**
	 * Request logging as ENVIRONMENT behavior (D2): prod/build/container are
	 * no-ops; both dev environments emit the request lines. This is the
	 * fallback for states not built by a facade; the facade fast path's
	 * `hooks.logRequest` takes precedence so subclass overrides keep working.
	 * Computes `reqTime` from `payload.timeStart` like `BaseApp.logThisRequest`.
	 */
	logRequest(manifest: SSRManifest, payload: RequestLogPayload): void;
}

const environments = new WeakMap<SSRManifest, RenderEnvironment>();

/**
 * Registers the environment for a manifest. Idempotent; last registration wins
 * (build may re-register after internals/options injection if it prefers).
 */
export function setEnvironment(manifest: SSRManifest, env: RenderEnvironment): void {
	environments.set(manifest, env);
}

/**
 * The environment for a manifest. Defaults to the production (bundled)
 * implementation, which is derivable from the manifest alone — so a bare
 * `new FetchState(request)` in a bundled worker needs no registration.
 */
export function getEnvironment(manifest: SSRManifest): RenderEnvironment {
	return environments.get(manifest) ?? productionEnvironment;
}
