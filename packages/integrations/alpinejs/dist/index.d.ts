import type { AstroIntegration } from 'astro';
interface Options {
	/**
	 *	You can extend Alpine by setting this option to a root-relative import specifier (for example, `entrypoint: "/src/entrypoint"`).
	 *
	 * The default export of this file should be a function that accepts an Alpine instance prior to starting, allowing the use of custom directives, plugins and other customizations for advanced use cases.
	 *
	 * ```js
	 * // astro.config.mjs
	 * import { defineConfig } from 'astro/config';
	 * import alpine from '@astrojs/alpinejs';
	 *
	 * export default defineConfig({
	 *   // ...
	 *   integrations: [alpine({ entrypoint: '/src/entrypoint' })],
	 * });
	 * ```
	 *
	 * ```js
	 * // src/entrypoint.ts
	 * import type { Alpine } from 'alpinejs'
	 *
	 * export default (Alpine: Alpine) => {
	 *     Alpine.directive('foo', el => {
	 *         el.textContent = 'bar';
	 *     })
	 * }
	 * ```
	 */
	entrypoint?: string;
}
export default function createPlugin(options?: Options): AstroIntegration;
export {};
