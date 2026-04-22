// This is public module with functions exported to the user

import { type AstroLoggerLevel, levels } from './core.js';

/**
 * Returns `true` if `messageLevel` has a level equals or higher than `configuredLevel`
 *
 * @param messageLevel The level of the incoming message
 * @param configuredLevel The level the logger is configured with
 */
export function matchesLevel(
	messageLevel: AstroLoggerLevel,
	configuredLevel: AstroLoggerLevel,
): boolean {
	return levels[messageLevel] >= levels[configuredLevel];
}
