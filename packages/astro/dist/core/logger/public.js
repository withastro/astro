import { levels } from './core.js';
function matchesLevel(messageLevel, configuredLevel) {
	return levels[messageLevel] >= levels[configuredLevel];
}
export { matchesLevel };
