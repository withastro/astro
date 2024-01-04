/**
 * Shared interfaces throughout the application that can be overridden by the user.
 */
declare namespace App {
	/**
	 * Used by middlewares to store information, that can be read by the user via the global `Astro.locals`
	 */
	interface Locals {}
}

/**
 * Shared interfaces throughout the build process of the Astro project that can be overridenn by integrations and the user.
 */
declare namespace AstroConfig {
	/**
	 * Used by integrations to declare custom hooks.
	 */
	interface IntegrationHooks {
	}
}
