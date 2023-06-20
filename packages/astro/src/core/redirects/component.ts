import type { AstroMiddlewareInstance, ComponentInstance } from '../../@types/astro';
import type { SinglePageBuiltModule } from '../build/types';
import type { MiddlewareHandler } from '../../@types/astro';

// A stub of a component instance for a given route
export const RedirectComponentInstance: ComponentInstance = {
	default() {
		return new Response(null, {
			status: 301,
		});
	},
};

export const RedirectSinglePageBuiltModule: SinglePageBuiltModule = {
	page: () => Promise.resolve(RedirectComponentInstance),
	onRequest: (ctx, next) => next(),
	renderers: [],
};
