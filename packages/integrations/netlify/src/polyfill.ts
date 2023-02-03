import { polyfill } from '@astrojs/webapi';

polyfill(globalThis, {
	exclude: 'window document',
});
