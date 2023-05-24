import type { ComponentInstance } from '../../@types/astro';

// A stub of a component instance for a given route
export const RedirectComponentInstance: ComponentInstance = {
	default() {
		return new Response(null, {
			status: 301
		});
	}
};
