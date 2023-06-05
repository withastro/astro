import type { AstroMiddlewareInstance, ComponentInstance } from '../../@types/astro';
import type { SinglePageBuiltModule } from '../build/types';

// A stub of a component instance for a given route
export const RedirectComponentInstance: ComponentInstance = {
	default() {
		return new Response(null, {
			status: 301,
		});
	},
};

const StaticMiddlewareInstance: AstroMiddlewareInstance<unknown> = {
	onRequest: (ctx, next) => next(),
};

export const RedirectSinglePageBuiltModule: SinglePageBuiltModule = {
	page: () => Promise.resolve(RedirectComponentInstance),
	middleware: StaticMiddlewareInstance,
	renderers: [],
}
