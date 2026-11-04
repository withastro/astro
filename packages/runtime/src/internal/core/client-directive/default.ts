import idlePrebuilt from '../../client/idle.prebuilt.js';
import loadPrebuilt from '../../client/load.prebuilt.js';
import mediaPrebuilt from '../../client/media.prebuilt.js';
import onlyPrebuilt from '../../client/only.prebuilt.js';
import visiblePrebuilt from '../../client/visible.prebuilt.js';

export function getDefaultClientDirectives() {
	return new Map([
		['idle', idlePrebuilt],
		['load', loadPrebuilt],
		['media', mediaPrebuilt],
		['only', onlyPrebuilt],
		['visible', visiblePrebuilt],
	]);
}
