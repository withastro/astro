import type { LoggerHandlerConfig } from './config.js';
import type { JsonHandlerConfig } from './impls/json.js';
import type { NodeHandlerConfig } from './impls/node.js';
import type { ConsoleHandlerConfig } from './impls/console.js';
export declare const logHandlers: {
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
	json(config?: JsonHandlerConfig): LoggerHandlerConfig;
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
	node(config?: NodeHandlerConfig): LoggerHandlerConfig;
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
	console(config?: ConsoleHandlerConfig): LoggerHandlerConfig;
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
	compose(...loggers: LoggerHandlerConfig[]): LoggerHandlerConfig;
};
