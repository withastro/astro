const logHandlers = {
	/**
	 * It uses the built-in Astro JSON logger.
	 * @example
	 * ```js
	 * export default defineConfig({
	 *   experimental: {
	 *     logger: logHandlers.json({ pretty: true })
	 *   }
	 * })
	 * ```
	 */
	json(config) {
		return {
			entrypoint: 'astro/logger/json',
			config,
		};
	},
	/**
	 * It uses the built-in Astro Node.js logger.
	 *
	 * @example
	 * ```js
	 * export default defineConfig({
	 *   experimental: {
	 *     logger: logHandlers.node({ pretty: true })
	 *   }
	 * })
	 * ```
	 */
	node(config) {
		return {
			entrypoint: 'astro/logger/node',
			config,
		};
	},
	/**
	 * It uses the built-in Astro console logger.
	 *
	 * @example
	 * ```js
	 * export default defineConfig({
	 *   experimental: {
	 *     logger: logHandlers.console({ pretty: true })
	 *   }
	 * })
	 * ```
	 */
	console(config) {
		return {
			entrypoint: 'astro/logger/console',
			config,
		};
	},
	/**
	 * It allows composing different loggers
	 *
	 * @example
	 * ```js
	 * export default defineConfig({
	 *   experimental: {
	 *     logger: logHandlers.compose(
	 *       logHandlers.console(),
	 *       logHandlers.json(),
	 *     )
	 *   }
	 * })
	 * ```
	 */
	compose(...loggers) {
		return {
			entrypoint: 'astro/logger/compose',
			config: {
				loggers,
			},
		};
	},
};
export { logHandlers };
