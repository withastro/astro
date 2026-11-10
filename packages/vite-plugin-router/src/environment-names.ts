/** The Vite environments the pages layer creates and builds. */
export const ASTRO_VITE_ENVIRONMENT_NAMES = {
	// It maps to the classic `ssr` Vite environment
	ssr: 'ssr',
	// It maps to the classic `client` Vite environment
	client: 'client',
	// Use this environment when `ssr` isn't a runnable dev environment, and you need
	// a runnable dev environment. A runnable dev environment allows you, for example,
	// to load a module via `runner.import`.
	//
	// This environment should be used only for dev, not production.
	astro: 'astro',
	// Environment used during the build for rendering static pages.
	// If your plugin runs in `ASTRO_VITE_ENVIRONMENT_NAMES.ssr`, you might
	// want to add `ASTRO_VITE_ENVIRONMENT_NAMES.prerender` too
	prerender: 'prerender',
} as const;
