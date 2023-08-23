import type { ComponentInstance } from '../../@types/astro';
import type { SinglePageBuiltModule } from '../build/types';

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
	renderers: [],
};
