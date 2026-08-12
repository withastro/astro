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
 * The payload chain sites pass to request logging (`logRequestFromState`).
 * `reqTime` is computed by the receiver (facade `logThisRequest` or the env
 * record) from `timeStart`.
 */
export type RequestLogPayload = Omit<LogRequestPayload, 'reqTime'> & { timeStart: number };

/**
 * The behavior that varies between rendering environments (production SSR,
 * the two dev paths, build/prerender, the container), expressed as a plain
 * record of functions and flags instead of a class hierarchy. Environments
 * register their record for a manifest with `setEnvironment`; readers use
 * `getEnvironment`, which falls back to the production record.
 *
 * When adding a member:
 * - Only behavior that genuinely differs between environments belongs here
 *   (e.g. request logging: production is silent, dev prints request lines).
 *   If the build can emit it as data or a module thunk, put it on the
 *   manifest instead; only behavior needing live services goes here.
 * - The record is stateless and shared. Mutable per-app state belongs in a
 *   manifest-keyed memo in the module that owns it, not here.
 * - Members must not capture an App instance. Environment-private services
 *   captured at setup time (the dev ModuleLoader, BuildInternals) are fine —
 *   request handling can't reach them.
 * - Behavior tied to one App instance — a public method a user may override
 *   on their app — cannot live here, because the record is shared by every
 *   app in the environment. The facade forwards that per request, via the
 *   hooks it passes to the FetchState constructor.
 */
export interface RenderEnvironment {
	/** Debug label. */
	readonly name: string;
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
	/** Renderers for `createResult`. Sync — render sites read it without awaiting. */
	getRenderers(manifest: SSRManifest): SSRLoadedRenderer[];
	/** Which error-page strategy `renderErrorPage` dispatches to. */
	readonly errorStrategy: 'default' | 'dev' | 'build';
	/** Dev-only CSP meta-tag injection flag for error pages. */
	readonly injectCspMetaTagsOnErrorPages: boolean;
	/**
	 * Request logging as environment behavior: prod/build/container are
	 * no-ops; both dev environments emit the request lines. This is the
	 * fallback for states not built by a facade; the facade fast path's
	 * `hooks.logRequest` takes precedence so subclass overrides keep working.
	 * Computes `reqTime` from `payload.timeStart`.
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
