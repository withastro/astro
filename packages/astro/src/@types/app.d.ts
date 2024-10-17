/**
 * Shared interfaces throughout the application that can be overridden by the user.
 */
declare namespace App {
	/**
	 * Used by middlewares to store information, that can be read by the user via the global `Astro.locals`
	 */
	interface Locals {}
}
