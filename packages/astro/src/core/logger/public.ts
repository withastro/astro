// This is public module with functions exported to the user

import { type AstroLoggerLevel, levels } from './core.js';

/**
 * Returns `true` if `messageLevel` has a level equals or higher than `configuredLevel`. As a golden rule,
 * the first argument should be level of the incoming message, and the second argument should be the
 * configured level of the logger.
 *
 * @param messageLevel The level of the incoming message
 * @param configuredLevel The level the logger is configured with
 *
 * @example
 *
 * ```js
 * matchesLevel('error', 'info') // true, because 'error' has higher priority than 'info'
 * matchesLevel('info', 'error') // false, because 'info' has lower priority than 'error'
 * ```
 */
export function matchesLevel(
	messageLevel: AstroLoggerLevel,
	configuredLevel: AstroLoggerLevel,
): boolean {
	return levels[messageLevel] >= levels[configuredLevel];
}
