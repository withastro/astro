/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { AstroClientDirectives } from './elements.js';
import type { BaseIntegrationHooks } from './integrations.js';

// The interfaces in this file can be extended by users
declare global {
	namespace App {
		/**
		 * Used by middlewares to store information, that can be read by the user via the global `Astro.locals`
		 */
		export interface Locals {}

		/**
		 * Optionally type the data stored in the session
		 */
		export interface SessionData {}

		/**
		 * Declare custom context providers to get typed access on `Astro` and `ctx`.
		 * Libraries and users register providers via `state.provide(key, { create, finalize? })`,
		 * and the corresponding types are declared here using module augmentation.
		 *
		 * Built-in providers like `session` are already typed by Astro and don't
		 * need to be declared here.
		 *
		 * @example
		 * ```ts
		 * declare namespace App {
		 *   interface Providers {
		 *     oauth: import('./lib/oauth').OAuthSession;
		 *   }
		 * }
		 * ```
		 */
		export interface Providers {}
	}

	namespace Astro {
		export interface IntegrationHooks extends BaseIntegrationHooks {}
		export interface ClientDirectives extends AstroClientDirectives {}
		export interface CustomImageProps {}
	}
}

export {};
