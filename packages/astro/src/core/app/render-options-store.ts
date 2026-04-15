/**
 * Per-request render options passed from BaseApp.render() into the Hono
 * middleware pipeline. Attached to the Request object via a Symbol so the
 * options are available anywhere the request is accessible — no async
 * context tracking needed.
 *
 * When a new Request is created (e.g. during rewrites), the caller must
 * copy the symbol over via `copyRenderOptions(oldReq, newReq)`.
 */
export interface RenderOptions {
	locals?: App.Locals;
	clientAddress?: string;
	addCookieHeader?: boolean;
	prerenderedErrorPageFetch?: ((url: string) => Promise<Response>) | undefined;
}

const RENDER_OPTIONS = Symbol.for('astro.renderOptions');

export function setRenderOptions(request: Request, options: RenderOptions): void {
	Reflect.set(request, RENDER_OPTIONS, options);
}

export function getRenderOptions(request: Request): RenderOptions | undefined {
	return Reflect.get(request, RENDER_OPTIONS) as RenderOptions | undefined;
}

export function copyRenderOptions(source: Request, target: Request): void {
	const options = Reflect.get(source, RENDER_OPTIONS);
	if (options) Reflect.set(target, RENDER_OPTIONS, options);
}
