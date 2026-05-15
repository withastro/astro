import type { AstroClientDirectives } from './elements.js';
import type { BaseIntegrationHooks } from './integrations.js';
declare global {
	namespace App {
		/**
		 * Used by middlewares to store information, that can be read by the user via the global `Astro.locals`
		 */
		interface Locals {}
		/**
		 * Optionally type the data stored in the session
		 */
		interface SessionData {}
	}
	namespace Astro {
		interface IntegrationHooks extends BaseIntegrationHooks {}
		interface ClientDirectives extends AstroClientDirectives {}
		interface CustomImageProps {}
	}
}
export {};
