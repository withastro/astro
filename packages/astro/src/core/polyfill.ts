import { polyfill } from '@astrojs/webapi';

// polyfill WebAPIs for Node.js runtime
polyfill(globalThis, {
	exclude: 'window document',
});
