import { polyfill } from '@astrojs/webapi';

export function apply() {
	// polyfill WebAPIs for Node.js runtime
	polyfill(globalThis, {
		exclude: 'window document',
	});
}
